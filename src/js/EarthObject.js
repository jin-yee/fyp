import * as THREE from '../../node_modules/three/build/three.module.js'
import Constant from '../js/Constant.js'

export default class Earth {

    constructor() {
        this.earth_total = new THREE.Object3D();
        var segments = 64;

        var earth = new THREE.Mesh(
            new THREE.SphereGeometry(Constant.radius, segments, segments),
            new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load('../images/earth_4k.jpg'),
                emissiveMap: new THREE.TextureLoader().load('../images/earth_night_transp.png'),
                emissive: new THREE.Color(0x444444),
                bumpMap: new THREE.TextureLoader().load('../images/elev_bump_4k.jpg'),
                bumpScale: 0.05,
                specularMap: new THREE.TextureLoader().load('../images/water_4k.png'),
                specular: new THREE.Color(0x444444)
            })
        )

        var clouds = new THREE.Mesh(
            new THREE.SphereGeometry(Constant.radius + 150, segments, segments),
            new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load('../images/fair_clouds_4k.png'),
                transparent: true
            })
        );

        this.earth_total.add(earth);
        earth.position.set(0, 0, 0);
        earth.rotation.x = Math.PI * 0.5;

        this.earth_total.add(clouds);
        clouds.position.set(0, 0, 0);
        clouds.rotation.x = Math.PI * 0.5;

        this.earth_total.name = 'earth_complex';
        this.earth_total.type = 'complex';
    }

    getEarth() {
        return this.earth_total;
    }
}