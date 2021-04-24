import * as THREE from '../../node_modules/three/build/three.module.js'
import Constant from '../js/Constant.js'

export default class Satellite {
    constructor(canvas, ra, rp, i, O, w, v) {
        this.canvas = canvas
        this.ra = ra
        this.rp = rp
        this.a = (this.ra + this.rp + 2 * Constant.radius) / 2;
        this.ec = (this.ra - this.rp) / (this.ra + this.rp + 2 * Constant.radius);
        this.i = +i
        this.OO = +O
        this.ww = +w
        this.v = +v
        this.geometry = new THREE.SphereGeometry(100, 64, 64);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.circle = new THREE.Mesh(this.geometry, this.material);
        this.circle.position.set(0, 0, 0)
        this.canvas.scene.add(this.circle)
    }

    updateSatellitePos(t) {
        var ii, no, aa, b, p, c, lon, Or, wr, w, O, E, M, ta, R
        ii = deg2Pi(this.i) //radian
        no = Math.sqrt(Constant.miu / Math.pow(this.a, 3)) //average angular rate rad/s
        aa = Math.sqrt(1 - this.ec * this.ec) //unitless
        b = 1 - 1.5 * Math.pow(Math.sin(ii), 2) // unitless
        p = this.a * (1 - this.ec * this.ec)
        c = 1.5 * Constant.j2 * Constant.radius * Constant.radius / Math.pow(p, 2)
        lon = no * (1 + aa * b * c) //rad/s

        // console.log(ii, no, aa, b, p, c, lon)

        Or = -c * lon * Math.cos(ii) //rad/s
        wr = c * lon * (2 - 2.5 * Math.pow(Math.sin(ii), 2))

        // console.log(Or, wr)

        w = deg2Pi(this.ww) + wr * t //rad
        O = deg2Pi(this.OO) + Or * t //rad
        E = 2 * Math.atan(Math.tan(deg2Pi(this.v / 2)) / Math.sqrt((1 + this.ec) / (1 - this.ec))) //rad
        M = E - this.ec * Math.sin(E) //rad
        ta = M + lon * t //rad

        var R = p / (1 + this.ec * Math.cos(ta))

        this.circle.position.x = R * (Math.cos(ta + w) * Math.cos(O) - Math.sin(ta + w) * Math.sin(O) * Math.cos(ii))
        this.circle.position.y = R * (Math.cos(ta + w) * Math.sin(O) + Math.sin(ta + w) * Math.cos(O) * Math.cos(ii))
        this.circle.position.z = R * (Math.sin(ta + w) * Math.sin(ii))

        // console.log(this.circle.position.x)
        // console.log(this.circle.position.y)
        // console.log(this.circle.position.z)
    }
}


function deg2Pi(x) {
    return (x * Math.PI) / 180
}