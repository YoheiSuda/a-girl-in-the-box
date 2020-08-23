import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {VRM, VRMUtils, VRMSchema} from '@pixiv/three-vrm';
import {AdditiveBlending} from "three";

import performance_rnn from "./performance_rnn";

// tslint:disable-next-line:no-require-import

export default function () {

    // renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#Canvas")
    });

    // camera
    const camera = new THREE.PerspectiveCamera(30.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
    camera.position.set(5.0, 5.0, 5.0);

    // scene
    const scene = new THREE.Scene();

    // light
    const light = new THREE.SpotLight(0xFFFFFF, 5, 100, Math.PI, 1);
    ;
    light.position.set(1.0, 1.0, 1.0).normalize();
    light.castShadow = true;
    scene.add(light);

    // gltf and vrm
    let currentVrm = undefined;
    const loader = new GLTFLoader();
    const loading = document.getElementById("loading");
    const loadingText = document.getElementById("loading_text");
    loader.crossOrigin = 'anonymous';
    loader.load(
        // URL of the VRM you want to load
        'models/shibu_dark.vrm',

        // called when the resource is loaded
        (gltf) => {

            // calling this function greatly improves the performance
            VRMUtils.removeUnnecessaryJoints(gltf.scene);

            // generate VRM instance from gltf
            VRM.from(gltf).then((vrm) => {
                scene.add(vrm.scene);
                currentVrm = vrm;

                //前側に向きを変更するためにつかう
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Hips).rotation.y = Math.PI;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Hips).position.set(0, 0, 0);


                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Neck).rotation.x = -0.5;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftUpperLeg).rotation.x = 2.5;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftLowerLeg).rotation.x = -2.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightUpperLeg).rotation.x = 2.5;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightLowerLeg).rotation.x = -2.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftUpperArm).rotation.y = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftUpperArm).rotation.x = -0.5;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftLowerArm).rotation.y = -1.3;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightUpperArm).rotation.y = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightUpperArm).rotation.x = -0.5;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightLowerArm).rotation.y = 1.3;

                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftIndexDistal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftIndexIntermediate).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftIndexProximal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftMiddleDistal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftMiddleIntermediate).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftMiddleProximal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftRingDistal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftRingIntermediate).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftRingProximal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftLittleDistal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftLittleIntermediate).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftLittleProximal).rotation.z = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftThumbDistal).rotation.y = 1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftThumbIntermediate).rotation.y = 1.0;

                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightIndexDistal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightIndexIntermediate).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightIndexProximal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightMiddleDistal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightMiddleIntermediate).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightMiddleProximal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightRingDistal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightRingIntermediate).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightRingProximal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightLittleDistal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightLittleIntermediate).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightLittleProximal).rotation.z = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightThumbDistal).rotation.y = -1.0;
                vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightThumbIntermediate).rotation.y = -1.0;
            });

        },
        // called while loading is progressing
        (progress) => {
            let loadingBar = loadingText.textContent.slice(-1);
            console.log(loadingBar);
            switch (loadingBar) {
                case "|":
                    loadingText.textContent = loadingText.textContent.replace("|", "/");
                    break;
                case "/":
                    loadingText.textContent = loadingText.textContent.replace("/", "-");
                    break;
                case "-":
                    loadingText.textContent = loadingText.textContent.replace("-", "\\");
                    break;
                case "\\":
                    loadingText.textContent = loadingText.textContent.replace("\\", "|");
                    break;
            }
            loading.insertAdjacentHTML('beforeend', '<p>progress:' + (Math.round(100.0 * progress.loaded / progress.total)) + '%...</p>');
            loading.insertAdjacentHTML('beforeend', '<p class="random-loading" style="top: '+ (Math.random() * 100) +'%; left: '+ (Math.random() * 100) +'%">Loading...</p>');
        },

        // called when loading has errors
        (error) => console.error(error)
    );

    // helpers
    // const gridHelper = new THREE.GridHelper(10, 10);
    // scene.add(gridHelper);
    //
    // const axesHelper = new THREE.AxesHelper(5);
    // scene.add(axesHelper);

    const group = new THREE.Group();
    scene.add(group);

    const Box = new THREE.BoxBufferGeometry(2, 2, 2);
    const edges = new THREE.EdgesGeometry(Box);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: AdditiveBlending
    }))
    group.add(line);


    // spheres
    let spheres = [];
    const sphere = new THREE.SphereBufferGeometry(0.1, 32, 16);


    for (let i = 0; i < 88; i++) {
        let sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            blending: AdditiveBlending,
            opacity: 0.5
        });

        let sphereMesh = new THREE.Mesh(sphere, sphereMaterial);
        sphereMesh.castShadow = true;

        sphereMesh.position.x = Math.random() * 5 - 2.5;
        sphereMesh.position.y = Math.random() * 5 - 2.5;
        sphereMesh.position.z = Math.random() * 5 - 2.5;

        sphereMesh.scale.x = sphereMesh.scale.y = sphereMesh.scale.z = Math.random() * 3 + 1;

        scene.add(sphereMesh);

        spheres.push(sphereMesh);

    }

    const clock = new THREE.Clock();
    let noteNum = 0;
    let rot = 0;
    let vrmFirstCheck = false;

    function animate() {

        requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();

        if (currentVrm) {
            const s = 0.1 * Math.sin(Math.PI * clock.elapsedTime);
            currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftEye).rotation.y = s;
            currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightEye).rotation.y = s;
            currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Chest).rotation.x = s * 0.1;

            currentVrm.update(deltaTime);

            if (vrmFirstCheck === false) {
                performance_rnn()
                loading.classList.remove('on');
                vrmFirstCheck = true;
            }

        }

        group.rotation.y = clock.elapsedTime * 0.1;
        group.rotation.x = clock.elapsedTime * 0.1;

        rot += 0.1;
        const radian = (rot * Math.PI) / 180;
        camera.position.x = 5 * Math.sin(radian);
        camera.position.y = 5 * Math.cos(radian);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        let noteNum_tmp = parseInt(localStorage.getItem("noteNum"));

        if (noteNum_tmp !== null && noteNum !== noteNum_tmp) {
            noteNum = noteNum_tmp - 21;
        }

        console.log(noteNum_tmp);

        if (spheres[noteNum].material !== undefined) {
            spheres[noteNum].material.color.setHex(Math.random() * 0xffffff);
            spheres[noteNum].scale.x = spheres[noteNum].scale.y = spheres[noteNum].scale.z = Math.random() * 3 + 1;
            spheres[noteNum].position.x = 3 * Math.cos(clock.elapsedTime * 0.1 * (noteNum - 43.5));
            spheres[noteNum].position.y = 3 * Math.sin(clock.elapsedTime * 0.1 * (noteNum - 43.5));
        }

        renderer.render(scene, camera);
    }

    animate();
    onResize();
    window.addEventListener('resize', onResize);


    function onResize() {
        // サイズを取得
        const width = window.innerWidth;
        const height = window.innerHeight;

        // レンダラーのサイズを調整する
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        // カメラのアスペクト比を正す
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

}

