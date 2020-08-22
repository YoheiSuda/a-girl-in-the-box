import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {VRM, VRMUtils, VRMSchema} from '@pixiv/three-vrm';
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {CopyShader} from "three/examples/jsm/shaders/CopyShader";
import {FilmPass} from "three/examples/jsm/postprocessing/FilmPass";
import {AdditiveBlending} from "three";

// tslint:disable-next-line:no-require-import

export default function () {

    // renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#Canvas")
    });

    //composer
    const composer = new EffectComposer(renderer);

    // camera
    const camera = new THREE.PerspectiveCamera(30.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
    camera.position.set(5.0, 5.0, 5.0);

    // camera controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.set(0.0, 0.0, 0.0);
    controls.update();

    // scene
    const scene = new THREE.Scene();

    //renderpass
    const renderPass = new RenderPass(scene, camera);
    // let effectFilm = new FilmPass(0.8, 0.325, 256, false);
    // effectFilm.renderToScreen = true;
    composer.addPass(renderPass);
    // composer.addPass(effectFilm);

    // light
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);

    // gltf and vrm
    let currentVrm = undefined;
    const loader = new GLTFLoader();
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
        (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),

        // called when loading has errors
        (error) => console.error(error)
    );

    // helpers
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const group = new THREE.Group();
    scene.add(group);

    const Box = new THREE.BoxBufferGeometry(3, 3, 3);
    const boxMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.1,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const edges = new THREE.EdgesGeometry(Box);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: 0xffffff
    }))
    const cube = new THREE.Mesh(Box, boxMaterial);
    group.add(cube);
    group.add(line);


    // spheres
    let spheres = [];
    const sphere = new THREE.SphereBufferGeometry(0.1, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: AdditiveBlending,
        opacity: 0.5
    });

    for (var i = 0; i < 500; i++) {

        let sphereMesh = new THREE.Mesh(sphere, sphereMaterial);

        sphereMesh.position.x = Math.random() * 10 - 5;
        sphereMesh.position.y = Math.random() * 10 - 5;
        sphereMesh.position.z = Math.random() * 10 - 5;

        sphereMesh.scale.x = sphereMesh.scale.y = sphereMesh.scale.z = Math.random() * 3 + 1;

        scene.add(sphereMesh);

        spheres.push(sphereMesh);

    }

    const clock = new THREE.Clock();

    function animate() {

        requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();

        if (currentVrm) {
            const s = 0.1 * Math.sin(Math.PI * clock.elapsedTime);
            currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.LeftEye).rotation.y = s;
            currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.RightEye).rotation.y = s;
            currentVrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Chest).rotation.x = s * 0.1;
            group.rotation.y = clock.elapsedTime * 0.1;
            group.rotation.x = clock.elapsedTime * 0.1;

            currentVrm.update(deltaTime);
        }

        for (let i = 0, il = spheres.length; i < il; i++) {

            let sphere = spheres[i];

            sphere.position.x = 5 * Math.cos(clock.elapsedTime * 0.1 + i);
            sphere.position.y = 5 * Math.sin(clock.elapsedTime * 0.1 + i * 1.1);

        }

        composer.render();

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

