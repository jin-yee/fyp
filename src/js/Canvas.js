import * as THREE from '../../node_modules/three/build/three.module.js'
import { TrackballControls } from '../../node_modules/three/examples/jsm/controls/TrackballControls.js'

export default class Canvas {

    constructor() {
        //class variable
        this.webglEl = document.getElementById('canvas')
        this.width = this.webglEl.clientWidth
        this.height = this.webglEl.clientHeight
        this.angle = 75
        this.near = 10.000
        this.far = 80000.000
        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer()
        this.camera = new THREE.PerspectiveCamera(this.angle, this.width / this.height, this.near / 5, this.far * 5)
        this.controls = new TrackballControls(this.camera, this.webglEl)
        this.axesHelper = new THREE.AxesHelper(7000);
        this.scene.add(this.axesHelper);

        //initialize
        this.sceneConfig(this.scene)
        this.cameraConfig(this.camera)
        this.rendererConfig(this.renderer, this.width, this.height)
        this.controlConfig(this.controls, this.near, this.far)

        var ambient = new THREE.AmbientLight(0xffffff);
        ambient.name = 'ambient light'
        this.scene.add(ambient);

        //Resize renderer while window is resized or when window is initialized
        
        window.addEventListener('resize', () => {
            this.width = this.webglEl.clientWidth;
            this.height = this.webglEl.clientHeight;
            this.renderer.setSize(this.width, this.height);
            this.webglEl.appendChild(this.renderer.domElement);
            this.camera.aspect = (this.width / this.height);
            this.camera.updateProjectionMatrix;
        })

        this.webglEl.appendChild(this.renderer.domElement);
    }

    controlConfig(controls, near, far) {
        // add controls for the scene
        controls.enableDamping = true;
        controls.dampingFactor = 0.6;
        controls.enableZoom = true;
        controls.zoomSpeed = 4;
        controls.minDistance = near * 2;
        controls.maxDistance = far - near;
        controls.enablePan = false;
    }

    sceneConfig(scene) {
        scene.background = new THREE.Color(0x444444)
    }

    cameraConfig(camera) {
        camera.up = new THREE.Vector3(0, 0, 1); // rotate coordinates.
        camera.position.x = 18000;
        camera.name = 'camera';
    }

    rendererConfig(renderer, width, height) {
        renderer.setSize(width, height);
    }

}