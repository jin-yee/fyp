import * as THREE from '../../node_modules/three/build/three.module.js'
import Constant from '../js/Constant.js'

export default class Satellite {
    constructor(canvas) {
        this.canvas = canvas
        this.geometry = new THREE.SphereGeometry(100, 64, 64);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.circle = new THREE.Mesh(this.geometry, this.material);
        this.circle.position.set(0, 0, 0)
        this.canvas.scene.add(this.circle)
        // this.addTHREESatelliteObject();
    }

    updateSatellitePos(satpos) {
        this.circle.position.x = satpos.sx
        this.circle.position.y = satpos.sy
        this.circle.position.z = satpos.sz
    }
}