import UI from './UI.js'
import Canvas from './Canvas.js'
import Constant from './Constant.js'
import Earth from './EarthObject.js'
import EarthStation from './EarthStation.js'
import Satellite from './SatelliteObject.js'
import {
    TimeStepCalculator,
    generateSatEciPosition,
    generateESEciPosition,
    epfdCalculator,
    passVisibility,
    pfd
} from './utils/epfdCalculator.js'
import { max } from 'date-fns'
const { ipcRenderer } = require('electron')

// import { uplinkHandler, downlinkHandler } from './lbhandler'

var form3 = document.getElementById('form-epfd')
const canvas = new Canvas()
const earth = new Earth().getEarth()
var tle = []
var es
var timeForSimulation
var sat
var simulation = 0
var pfdmask
var a, ec, i, O, w, v, lat, lon

function main() {
    UI()
    canvas.scene.add(earth)
    animate()

    var xmlfile = document.getElementById('xmlfile');

    xmlfile.addEventListener('change', () => {
        var file = xmlfile.files[0],
            reader = new FileReader()

        reader.onloadend = function (event) {
            console.log("Done Loading mask")
            var text = event.target.result

            const parser = new DOMParser();
            const doc1 = parser.parseFromString(text, "application/xml");

            pfdmask = doc1.getElementsByTagName('pfd_mask')[0]

            console.log(pfd(pfdmask, {
                sx: -6917.050386065128,
                sy: -10.396199154204027,
                sz: -921.3107601154002
            }, {
                ex: -6373.326851506861,
                ey: -103.64934989729136,
                ez: 225.1561617022931
            }))
        }


        reader.readAsText(file)
    })

    form3.onsubmit = (e) => {
        e.preventDefault();

        //get all the user input
        var ra = +document.getElementById('ra').value,
            rp = +document.getElementById('rp').value,
            dish = +document.getElementById('dish').value,
            gr = +document.getElementById('gr').value,
            nhit = +document.getElementById('nhit').value,
            fdown = +document.getElementById('fdown').value;

        i = +document.getElementById('i').value
        O = +document.getElementById('O').value
        w = +document.getElementById('w').value
        v = +document.getElementById('v').value
        lon = +document.getElementById('lon').value
        lat = +document.getElementById('lat').value

        var lambda = Constant.lightSpeed / (fdown * Math.pow(10, 6));
        var delta3db = 70 * lambda / dish;
        a = (ra + rp + 2 * Constant.radius) / 2;
        ec = (ra - rp) / (ra + rp + 2 * Constant.radius);

        var { time_step, time_run } = TimeStepCalculator(a, ec, i, delta3db, nhit);

        var epfdInput = {
            a: a,
            e: ec,
            i: i,
            O: O,
            w: w,
            v: v,
            f: fdown,
            gr: gr,
            ts: time_step,
            rt: max(86400, time_run),
            lambda: lambda,
            delta3db: delta3db,
        }

        ipcRenderer.send('epfd-send', epfdInput)

        // var satposition = generateSatEciPosition(a, ec, i, w, O, v, time_step)
        // var esPosition = generateESEciPosition(lon, lat, time_step)
        // var interestES = []

        // var interestSat = satposition.filter(({ sx, sy, sz }, index) => {
        //     var { ex, ey, ez } = esPosition[index]
        //     var absx = Math.pow(sx - ex, 2)
        //     var absy = Math.pow(sy - ey, 2)
        //     var absz = Math.pow(sz - ez, 2)
        //     var d = Math.sqrt(absx + absy + absz)
        //     if (passVisibility(d, { sx, sy, sz })) {
        //         interestES.push(esPosition[index])
        //         return true
        //     } else {
        //         return false
        //     }
        // })
        // if (pfdmask) {
        //     var result = epfdCalculator(pfdmask, interestSat, interestES, gr)
        // }

        // console.log(result)

        simulation = 1
    }

    es = new EarthStation(lon, lat, canvas, 1)
    sat = new Satellite(canvas)
}

// var clock = new Clock()
// var startTime = clock.getElapsedTime()
// var clock = new Clock()
function animate() {
    if (simulation) {
        // if (clock.getElapsedTime() > 0) {
        //     sat.updateSatellitePos(generateSatEciPosition(+a, +ec, +i, +w, +O, +v, clock.getElapsedTime() * 8640))
        //     earth.rotation.z = 2 * Math.PI * clock.getElapsedTime() * 8640 / 86400
        // }
        // var elapseTime = clock.getElapsedTime() - startTime;

        // if (elapseTime + timeForSimulation.time_step < timeForSimulation.end_time) {
        // elapseTime = elapseTime + timeForSimulation.time_step
        // sat.updateSatellitePos(generateSatEciPosition(+a, +ec, +i, +w, +O, +v, +elapseTime*60*348))
        // earth.rotation.z = Constant.omegae * Math.PI * elapseTime *348/ 180
        //         earth.rotation.z = Constant.omegae * Math.PI * elapseTime / 180
        //         //earth station rotation update
        //         es.updateGciXYZ(elapseTime)

        //         //satellite movement
        //         ngsoSat2.updateSatellitePos(elapseTime / 60.0)

        //         //Let' do a visibility check
        //         var vectorSat = new Vector3(ngsoSat.circle.position.x, ngsoSat.circle.position.y, ngsoSat.circle.position.z)
        //         var vectorES = new Vector3(es.circle.position.x, es.circle.position.y, es.circle.position.z)
        //         var d = vectorSat.distanceTo(vectorES);
        //         if (d < vectorSat.length()) {
        //             var epfd = 10 * Math.log(ngsoSat.eirp * es.gr * ngsoSat.gt / (4 * Math.PI * d))
        //             var rec = {
        //                 time: new Date(),
        //                 epfd: epfd,
        //             };
        //         }
        //     } else {
        //         simulation = false;
        //     }
    }

    //call it recursively for animation
    requestAnimationFrame(animate)
    canvas.renderer.render(canvas.scene, canvas.camera);
    canvas.controls.update();
    // }
}

main()