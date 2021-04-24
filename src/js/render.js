import UI from './UI.js'
import Canvas from './Canvas.js'
import Constant from './Constant.js'
import Earth from './EarthObject.js'
import EarthStation from './EarthStation.js'
import Satellite from './SatelliteObject.js'
import { Clock } from '../../node_modules/three/build/three.module.js'
import { GUI } from '../../node_modules/three/examples/jsm/libs/dat.gui.module.js'
const { ipcRenderer } = require('electron')
const xml2js = require('xml2js')

let simulateBtn = document.getElementById('simulateBtn')
let resetBtn = document.getElementById('resetBtn')

const gui = new GUI()
const canvas = new Canvas()
const earth = new Earth().getEarth()

var es
var sat
var pfdmask
var ra, rp, dish, gr, nhit, fdown, a, ec, i, O, w, v, lat, lon, lambda, delta3db
var clock

function main() {

    //dat gui
    gui.add(Constant, 'fff', 1, 8640)

    clock = new Clock()
    canvas.scene.add(earth)

    UI()
    animate()

    var xmlfile = document.getElementById('xmlfile');

    xmlfile.addEventListener('change', () => {
        var file = xmlfile.files[0],
            reader = new FileReader()

        reader.onloadend = function (event) {
            console.log("Done Loading mask")
            pfdmask = event.target.result
        }

        reader.readAsText(file)
    })

    simulateBtn.onclick = (e) => {
        e.preventDefault();

        if(document.getElementById('xmlfile').value == ""){
            alert("Submit a valid xml file!")
            return false
        }

        //get all the user input
        ra = +document.getElementById('ra').value
        rp = +document.getElementById('rp').value
        dish = +document.getElementById('dish').value
        gr = +document.getElementById('gr').value
        nhit = +document.getElementById('nhit').value
        fdown = +document.getElementById('fdown').value
        i = +document.getElementById('inc').value
        O = +document.getElementById('O').value
        w = +document.getElementById('w').value
        v = +document.getElementById('v').value
        lon = +document.getElementById('lon').value
        lat = +document.getElementById('lat').value
        lambda = Constant.lightSpeed / (fdown * Math.pow(10, 9));
        delta3db = 70 * lambda / dish;
        a = (ra + rp + 2 * Constant.radius) / 2;
        ec = (ra - rp) / (ra + rp + 2 * Constant.radius);

        // es = new EarthStation(lon, lat, canvas, 1)
        sat = new Satellite(canvas, ra, rp, i, O, w, v)
        gui.add(Constant, 'Visualize')
        gui.add(sat, 'ra', 600, 3000)
        gui.add(sat, 'rp', 600, 3000)
        gui.add(sat, 'i', 0, 179)
        gui.add(sat, 'OO', 0, 179)
        gui.add(sat, 'ww', 0, 359)


        xml2js.parseStringPromise(pfdmask).then((result) => {
            var epfdInput = {
                a: a,
                e: ec,
                i: i,
                O: O,
                w: w,
                v: v,
                f: fdown,
                nhit: nhit,
                gr: gr,
                mask: result,
                lambda: lambda,
                dish: dish,
                delta3db: delta3db,
                lon: lon,
                lat: lat
            }
            ipcRenderer.send('epfd-send', epfdInput)
        })
    }

    // resetBtn.onclick = () => {
    //     Constant.simulation = 0
    //     sat = undefined
    //     es = undefined
    //     hehe.disable = false;
    // }

    // form3.onsubmit = (e) => {
    //     e.preventDefault();

    //     //disable submit
    //     hehe.disabled = true;

    //     //get all the user input
    //     ra = +document.getElementById('ra').value
    //     rp = +document.getElementById('rp').value
    //     dish = +document.getElementById('dish').value
    //     gr = +document.getElementById('gr').value
    //     nhit = +document.getElementById('nhit').value
    //     fdown = +document.getElementById('fdown').value
    //     i = +document.getElementById('inc').value
    //     O = +document.getElementById('O').value
    //     w = +document.getElementById('w').value
    //     v = +document.getElementById('v').value
    //     lon = +document.getElementById('lon').value
    //     lat = +document.getElementById('lat').value
    //     lambda = Constant.lightSpeed / (fdown * Math.pow(10, 9));
    //     delta3db = 70 * lambda / dish;
    //     a = (ra + rp + 2 * Constant.radius) / 2;
    //     ec = (ra - rp) / (ra + rp + 2 * Constant.radius);

    //     // es = new EarthStation(lon, lat, canvas, 1)
    //     sat = new Satellite(canvas, ra, rp, i, O, w, v)
    //     gui.add(Constant, 'Visualize')
    //     gui.add(sat, 'ra', 600, 3000)
    //     gui.add(sat, 'rp', 600, 3000)
    //     gui.add(sat, 'i', 0, 179)
    //     gui.add(sat, 'OO', 0, 179)
    //     gui.add(sat, 'ww', 0, 359)


    //     xml2js.parseStringPromise(pfdmask).then((result) => {
    //         var epfdInput = {
    //             a: a,
    //             e: ec,
    //             i: i,
    //             O: O,
    //             w: w,
    //             v: v,
    //             f: fdown,
    //             nhit: nhit,
    //             gr: gr,
    //             mask: result,
    //             lambda: lambda,
    //             dish: dish,
    //             delta3db: delta3db,
    //             lon: lon,
    //             lat: lat
    //         }
    //         ipcRenderer.send('epfd-send', epfdInput)
    //     })
    // }

    ipcRenderer.on('epfd-reply', (event, arg) => {
        console.log(arg)
    })


}

function animate() {
    if (Constant.simulation) {
        sat.updateSatellitePos(clock.getElapsedTime() * Constant.fff)
        earth.rotation.z = 2 * Math.PI * clock.getElapsedTime() * Constant.fff / 86400
    }

    //call it recursively for animation
    requestAnimationFrame(animate)
    canvas.renderer.render(canvas.scene, canvas.camera);
    canvas.controls.update();
}

main()