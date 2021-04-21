import Constant from './Constant.js'
import * as THREE from '../../node_modules/three/build/three.module.js'

export default class EarthStation {
    constructor(long, lat, canvas, gr) {
        this.longitude = long
        this.latitude = lat
        this.canvas = canvas
        this.gr = gr

        //satellite shape
        this.geometry = new THREE.SphereGeometry(50, 64, 64);
        this.material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        this.circle = new THREE.Mesh(this.geometry, this.material);

        this.addES2Map()
    }

    updateGciXYZ(time) {
        var x, y, z;
        var lat_radian = this.latitude * Math.PI / 180
        var long_radian = this.longitude * Math.PI / 180
        var omegae_radian = Constant.omegae * Math.PI / 180
        x = Constant.radius * (Math.cos(lat_radian) * Math.cos(long_radian + omegae_radian * time))
        y = Constant.radius * (Math.cos(lat_radian) * Math.sin(long_radian + omegae_radian * time))
        z = Constant.radius * Math.sin(lat_radian)

        this.circle.position.x = x
        this.circle.position.y = y
        this.circle.position.z = z
    }

    getInitialGciXYZ() {

        var x, y, z;
        var lat_radian = this.latitude * Math.PI / 180
        var long_radian = this.longitude * Math.PI / 180
        x = Constant.radius * (Math.cos(lat_radian) * Math.cos(long_radian))
        y = Constant.radius * (Math.cos(lat_radian) * Math.sin(long_radian))
        z = Constant.radius * Math.sin(lat_radian)
        return {
            x: x,
            y: y,
            z: z
        }
    }

    addES2Map() {
        this.circle.position.x = this.getInitialGciXYZ().x
        this.circle.position.y = this.getInitialGciXYZ().y
        this.circle.position.z = this.getInitialGciXYZ().z
        this.canvas.scene.add(this.circle)
    }
}