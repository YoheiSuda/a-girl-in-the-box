/* Copyright 2017 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import * as tf from '@tensorflow/tfjs-core';
import * as tonePiano from "tone-piano";
// tslint:disable-next-line:no-require-import

export default function () {
    const Piano = tonePiano.Piano;

    let lstmKernel1;
    let lstmBias1;
    let lstmKernel2;
    let lstmBias2;
    let lstmKernel3;
    let lstmBias3;
    let c;
    let h;
    let fcB;
    let fcW;
    const forgetBias = tf.scalar(1.0);
    const activeNotes = new Map();

// How many steps to generate per generateStep call.
// Generating more steps makes it less likely that we'll lag behind in note
// generation. Generating fewer steps makes it less likely that the browser UI
// thread will be starved for cycles.
    const STEPS_PER_GENERATE_CALL = 10;
// How much time to try to generate ahead. More time means fewer buffer
// underruns, but also makes the lag from UI change to output larger.
    const GENERATION_BUFFER_SECONDS = .5;
// If we're this far behind, reset currentTime time to piano.now().
    const MAX_GENERATION_LAG_SECONDS = 1;
// If a note is held longer than this, release it.
    const MAX_NOTE_DURATION_SECONDS = 3;

    const NOTES_PER_OCTAVE = 12;
    const DENSITY_BIN_RANGES = [1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0];
    const PITCH_HISTOGRAM_SIZE = NOTES_PER_OCTAVE;
    let pitchHistogramEncoding;
    let noteDensityEncoding;
    let conditioned = false;
    const RESET_RNN_FREQUENCY_MS = 30000;

    let currentPianoTimeSec = 0;
// When the piano roll starts in browser-time via performance.now().
    let pianoStartTimestampMs = 0;

    let currentVelocity = 100;

    const MIN_MIDI_PITCH = 0;
    const MAX_MIDI_PITCH = 127;
    const VELOCITY_BINS = 32;
    const MAX_SHIFT_STEPS = 100;
    const STEPS_PER_SECOND = 100;

    const MIDI_EVENT_OFF = 0x80;

    let currentLoopId = 0;

    const EVENT_RANGES = [
        ['note_on', MIN_MIDI_PITCH, MAX_MIDI_PITCH],
        ['note_off', MIN_MIDI_PITCH, MAX_MIDI_PITCH],
        ['time_shift', 1, MAX_SHIFT_STEPS],
        ['velocity_change', 1, VELOCITY_BINS],
    ];

    function calculateEventSize() {
        let eventOffset = 0;
        for (const eventRange of EVENT_RANGES) {
            const minValue = eventRange[1];
            const maxValue = eventRange[2];
            eventOffset += maxValue - minValue + 1;
        }
        return eventOffset;
    }

    const EVENT_SIZE = calculateEventSize();
    const PRIMER_IDX = 355;  // shift 1s.
    let lastSample = tf.scalar(PRIMER_IDX, 'int32');

    const piano = new Piano({velocities: 4}).toMaster();

    const SALAMANDER_URL = 'audio/';
    const CHECKPOINT_URL = 'https://storage.googleapis.com/' +
        'download.magenta.tensorflow.org/models/performance_rnn/tfjs';

    const isDeviceSupported = tf.ENV.get('WEBGL_VERSION') >= 1;

    if (!isDeviceSupported) {
        console.log('We do not yet support your device. Please try on a desktop computer with Chrome/Firefox, or an Android phone with WebGL support.');

    } else {
        start()
    }

    let modelReady = false;


    function start() {
        piano.load(SALAMANDER_URL)
            .then(() => {
                return fetch(`${CHECKPOINT_URL}/weights_manifest.json`)
                    .then((response) => response.json())
                    .then(
                        (manifest) =>
                            tf.loadWeights(manifest, CHECKPOINT_URL));
            })
            .then((vars) => {

                lstmKernel1 =
                    vars['rnn/multi_rnn_cell/cell_0/basic_lstm_cell/kernel'];
                lstmBias1 = vars['rnn/multi_rnn_cell/cell_0/basic_lstm_cell/bias'];

                lstmKernel2 =
                    vars['rnn/multi_rnn_cell/cell_1/basic_lstm_cell/kernel'];
                lstmBias2 = vars['rnn/multi_rnn_cell/cell_1/basic_lstm_cell/bias'];

                lstmKernel3 =
                    vars['rnn/multi_rnn_cell/cell_2/basic_lstm_cell/kernel'];
                lstmBias3 = vars['rnn/multi_rnn_cell/cell_2/basic_lstm_cell/bias'];

                fcB = vars['fully_connected/biases'];
                fcW = vars['fully_connected/weights'];
                modelReady = true;
                resetRnn();
            });
    }

    function resetRnn() {
        c = [
            tf.zeros([1, lstmBias1.shape[0] / 4]),
            tf.zeros([1, lstmBias2.shape[0] / 4]),
            tf.zeros([1, lstmBias3.shape[0] / 4]),
        ];
        h = [
            tf.zeros([1, lstmBias1.shape[0] / 4]),
            tf.zeros([1, lstmBias2.shape[0] / 4]),
            tf.zeros([1, lstmBias3.shape[0] / 4]),
        ];
        if (lastSample != null) {
            lastSample.dispose();
        }
        lastSample = tf.scalar(PRIMER_IDX, 'int32');
        currentPianoTimeSec = piano.now();
        pianoStartTimestampMs = performance.now() - currentPianoTimeSec * 1000;
        currentLoopId++;
        generateStep(currentLoopId);
    }

    const densityControl = 4;

    const gainSliderElement = 25;

    let globalGain = +gainSliderElement;


//const notes = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b'];

    const pitchHistogramElements = [1, 2, 0, 2, 0, 1, 2, 0, 2, 0, 2, 0]; //ロクリアンスケール

    function updateConditioningParams() {
        const pitchHistogram = pitchHistogramElements

        if (noteDensityEncoding != null) {
            noteDensityEncoding.dispose();
            noteDensityEncoding = null;
        }

        const noteDensityIdx = densityControl || 0;

        noteDensityEncoding =
            tf.oneHot(
                tf.tensor1d([noteDensityIdx + 1], 'int32'),
                DENSITY_BIN_RANGES.length + 1).as1D();

        if (pitchHistogramEncoding != null) {
            pitchHistogramEncoding.dispose();
            pitchHistogramEncoding = null;
        }
        const buffer = tf.buffer([PITCH_HISTOGRAM_SIZE], 'float32');
        const pitchHistogramTotal = pitchHistogram.reduce((prev, val) => {
            return prev + val;
        });
        for (let i = 0; i < PITCH_HISTOGRAM_SIZE; i++) {
            buffer.set(pitchHistogram[i] / pitchHistogramTotal, i);
        }
        pitchHistogramEncoding = buffer.toTensor();
    }


    updateConditioningParams();

    function getConditioning() {
        return tf.tidy(() => {
            if (!conditioned) {
                // TODO(nsthorat): figure out why we have to cast these shapes to numbers.
                // The linter is complaining, though VSCode can infer the types.
                const size = 1 + (noteDensityEncoding.shape[0]) +
                    (pitchHistogramEncoding.shape[0]);
                const conditioning =
                    tf.oneHot(tf.tensor1d([0], 'int32'), size).as1D();
                return conditioning;
            } else {
                const axis = 0;
                const conditioningValues =
                    noteDensityEncoding.concat(pitchHistogramEncoding, axis);
                return tf.tensor1d([0], 'int32').concat(conditioningValues, axis);
            }
        });
    }

    async function generateStep(loopId) {
        if (loopId < currentLoopId) {
            // Was part of an outdated generateStep() scheduled via setTimeout.
            return;
        }

        const lstm1 = (data, c, h) =>
            tf.basicLSTMCell(forgetBias, lstmKernel1, lstmBias1, data, c, h);
        const lstm2 = (data, c, h) =>
            tf.basicLSTMCell(forgetBias, lstmKernel2, lstmBias2, data, c, h);
        const lstm3 = (data, c, h) =>
            tf.basicLSTMCell(forgetBias, lstmKernel3, lstmBias3, data, c, h);

        let outputs = [];
        [c, h, outputs] = tf.tidy(() => {
            // Generate some notes.
            const innerOuts = [];
            for (let i = 0; i < STEPS_PER_GENERATE_CALL; i++) {
                // Use last sampled output as the next input.
                const eventInput = tf.oneHot(
                    lastSample.as1D(), EVENT_SIZE).as1D();
                // Dispose the last sample from the previous generate call, since we
                // kept it.
                if (i === 0) {
                    lastSample.dispose();
                }
                const conditioning = getConditioning();
                const axis = 0;
                const input = conditioning.concat(eventInput, axis).toFloat();
                const output =
                    tf.multiRNNCell([lstm1, lstm2, lstm3], input.as2D(1, -1), c, h);
                c.forEach(c => c.dispose());
                h.forEach(h => h.dispose());
                c = output[0];
                h = output[1];

                const outputH = h[2];
                const logits = outputH.matMul(fcW).add(fcB);

                const sampledOutput = tf.multinomial(logits.as1D(), 1).asScalar();

                innerOuts.push(sampledOutput);
                lastSample = sampledOutput;
            }
            return [c, h, innerOuts];
        });

        for (let i = 0; i < outputs.length; i++) {
            playOutput(outputs[i].dataSync()[0]);
        }

        if (piano.now() - currentPianoTimeSec > MAX_GENERATION_LAG_SECONDS) {
            console.warn(
                `Generation is ${piano.now() - currentPianoTimeSec} seconds behind, ` +
                `which is over ${MAX_NOTE_DURATION_SECONDS}. Resetting time!`);
            currentPianoTimeSec = piano.now();
        }
        const delta = Math.max(
            0, currentPianoTimeSec - piano.now() - GENERATION_BUFFER_SECONDS);
        setTimeout(() => generateStep(loopId), delta * 1000);
    }

    let activeMidiOutputDevice = null;

    /**
     * Decode the output index and play it on the piano and keyboardInterface.
     */
    function playOutput(index) {
        let offset = 0;
        for (const eventRange of EVENT_RANGES) {
            const eventType = eventRange[0];
            const minValue = eventRange[1];
            const maxValue = eventRange[2];
            if (offset <= index && index <= offset + maxValue - minValue) {
                if (eventType === 'note_on') {
                    const noteNum = index - offset;
                    console.log(noteNum)
                    activeNotes.set(noteNum, currentPianoTimeSec);

                    return piano.keyDown(
                        noteNum, currentPianoTimeSec, currentVelocity * globalGain / 100);
                } else if (eventType === 'note_off') {
                    const noteNum = index - offset;
                    const activeNoteEndTimeSec = activeNotes.get(noteNum);
                    // If the note off event is generated for a note that hasn't been
                    // pressed, just ignore it.
                    if (activeNoteEndTimeSec == null) {
                        return;
                    }
                    const timeSec =
                        Math.max(currentPianoTimeSec, activeNoteEndTimeSec + .5);

                    if (activeMidiOutputDevice != null) {
                        activeMidiOutputDevice.send(
                            [
                                MIDI_EVENT_OFF, noteNum,
                                Math.min(Math.floor(currentVelocity * globalGain), 127)
                            ],
                            Math.floor(timeSec * 1000) - pianoStartTimestampMs);
                    }
                    piano.keyUp(noteNum, timeSec);
                    activeNotes.delete(noteNum);
                    return;
                } else if (eventType === 'time_shift') {
                    currentPianoTimeSec += (index - offset + 1) / STEPS_PER_SECOND;
                    activeNotes.forEach((timeSec, noteNum) => {
                        if (currentPianoTimeSec - timeSec > MAX_NOTE_DURATION_SECONDS) {
                            console.info(
                                `Note ${noteNum} has been active for ${
                                    currentPianoTimeSec - timeSec}, ` +
                                `seconds which is over ${MAX_NOTE_DURATION_SECONDS}, will ` +
                                `release.`);
                            if (activeMidiOutputDevice != null) {
                                activeMidiOutputDevice.send([
                                    MIDI_EVENT_OFF, noteNum,
                                    Math.min(Math.floor(currentVelocity * globalGain), 127)
                                ]);
                            }
                            piano.keyUp(noteNum, currentPianoTimeSec);
                            activeNotes.delete(noteNum);
                        }
                    });
                    return currentPianoTimeSec;
                } else if (eventType === 'velocity_change') {
                    currentVelocity = (index - offset + 1) * Math.ceil(127 / VELOCITY_BINS);
                    currentVelocity = currentVelocity / 127;
                    return currentVelocity;
                } else {
                    throw new Error('Could not decode eventType: ' + eventType);
                }
            }
            offset += maxValue - minValue + 1;
        }
        throw new Error(`Could not decode index: ${index}`);
    }

// Reset the RNN repeatedly so it doesn't trail off into incoherent musical
// babble.
    function resetRnnRepeatedly() {
        if (modelReady) {
            resetRnn();
        }

        setTimeout(resetRnnRepeatedly, RESET_RNN_FREQUENCY_MS);
    }
    setTimeout(resetRnnRepeatedly, RESET_RNN_FREQUENCY_MS);

}

