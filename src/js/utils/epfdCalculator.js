import Constant from '../Constant.js'
import { Vector3 } from '../../../node_modules/three/build/three.module.js'

const TimeStepCalculator = (a, e, i, gso_es_3db, nhit) => {

    var inclination_deg = i,
        perigee = a * (1 - e),
        phi = 0.5 * gso_es_3db - (180 / Math.PI) * Math.asin(Math.sin(deg2Pi(0.5 * gso_es_3db)) * Constant.radius / (Constant.radius + perigee)), // degree
        omegas = 0.071 / Math.pow(1 + perigee / Constant.radius, 1.5), //degree/s
        omega = Math.sqrt(Math.pow(omegas * Math.cos(deg2Pi(inclination_deg)) - Constant.omegae, 2) + Math.pow(omegas * Math.sin(deg2Pi(inclination_deg)), 2)), //deg/s
        time_interval = 2 * phi / omega, // time interval when a NGSO sat passes through the main beam of a GSO ES antenna
        time_step = time_interval / nhit, // time increment of our simulation
        time_run = Math.abs(2 * Math.PI / (omegas - Constant.omegae)); // end time

    console.log(time_step)
    return {
        time_step: time_step,
        time_run: time_run,
    }
}

const generateSatEciPosition = (a, e, i, ww, OO, v, time_step) => {
    var position = [];

    i = deg2Pi(i) //radian
    var no = Math.sqrt(Constant.miu / Math.pow(a, 3)) //average angular rate rad/s
    var aa = Math.sqrt(1 - e * e) //unitless
    var b = 1 - 1.5 * Math.pow(Math.sin(i), 2) // unitless
    var p = a * (1 - e * e)
    var c = 1.5 * Constant.j2 * Constant.radius * Constant.radius / Math.pow(p, 2)
    var lon = no * (1 + aa * b * c) //rad/s

    var Or = -c * lon * Math.cos(i) //rad/s
    var wr = c * lon * (2 - 2.5 * Math.pow(Math.sin(i), 2))
    var orbitPeriod = 2 * Math.PI / (wr + lon)

    for (var t = 0; t < 86400; t = t + time_step) { //run for one day
        var w = deg2Pi(ww) + wr * t //rad
        var O = deg2Pi(OO) + Or * t //rad

        // var ta = this.satrec.mo + (2 * this.satrec.ecco - 0.25 * Math.pow(this.satrec.ecco, 3) * Math.sin(this.satrec.mo) + 1.25 * Math.pow(this.satrec.ecco, 2) * Math.sin(2 * this.satrec.mo))
        var E = 2 * Math.atan(Math.tan(deg2Pi(v / 2)) / Math.sqrt((1 + e) / (1 - e))) //rad
        var M = E - e * Math.sin(E) //rad
        var ta = M + lon * t //rad

        var R = p / (1 + e * Math.cos(ta))
        var x = R * (Math.cos(ta + w) * Math.cos(O) - Math.sin(ta + w) * Math.sin(O) * Math.cos(i))
        var y = R * (Math.cos(ta + w) * Math.sin(O) + Math.sin(ta + w) * Math.cos(O) * Math.cos(i))
        var z = R * (Math.sin(ta + w) * Math.sin(i))

        position.push({
            sx: x,
            sy: y,
            sz: z,
        })
    }
    // return position
    return position
}

const generateESEciPosition = (gsoESLongitude, gsoESLatitude, time_step) => {
    var lat_radian = deg2Pi(gsoESLatitude)
    var long_radian = deg2Pi(gsoESLongitude)
    var omegae_radian = deg2Pi(Constant.omegae)

    var position = []
    for (var t = 0; t < 86400; t = t + time_step) {
        var x, y, z, xg, yg, zg
        x = Constant.radius * (Math.cos(lat_radian) * Math.cos(long_radian + omegae_radian * t))
        y = Constant.radius * (Math.cos(lat_radian) * Math.sin(long_radian + omegae_radian * t))
        z = Constant.radius * Math.sin(lat_radian)
        xg = (Constant.radius + 35786) * (Math.cos(lat_radian) * Math.cos(long_radian + omegae_radian * t))
        yg = (Constant.radius + 35786) * (Math.cos(lat_radian) * Math.sin(long_radian + omegae_radian * t))
        zg = (Constant.radius + 35786) * Math.sin(lat_radian)

        position.push({
            ex: x,
            ey: y,
            ez: z,
            xg: xg,
            yg: yg,
            zg: zg
        })
    }

    return position
}

const offAxisCalculator = (satpos, gpos, espos) => {
    var d1 = {
        x: satpos.x - espos.x,
        y: satpos.y - espos.y,
        z: satpos.z - espos.z
    }
    var d2 = {
        x: gpos.x - espos.x,
        y: gpos.y - espos.y,
        z: gpos.z - espos.z
    }

    var dot = d1.x * d2.x + d1.y * d2.y + d1.z * d2.z
    var l1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y + d1.z * d1.z)
    var l2 = Math.sqrt(d2.x * d1.x + d2.y * d1.y + d2.z * d1.z)

    var dotProduct = dot / (l1 * l2)

    return Math.acos(dotProduct) * 180 / Math.PI
}

const pfd = (pfdmask, satpos, espos) => {

    var { sx, sy, sz } = satpos
    var { ex, ey, ez, xg, yg, zg } = espos

    var d = new Vector3(sx, sy, sz).distanceTo(new Vector3(ex, ey, ez))

    var az = Math.atan((ex - sx) / (ey - sy)) * 180 / Math.PI
    var el = Math.asin((ez - sz) / d) * 180 / Math.PI

    // console.log(sx, sy, sz)
    // console.log(ex, ey, ez)
    // console.log(Math.sqrt(Math.pow(h, 2) + Math.pow(dx, 2)), d, h, dx, az, el)
    var pfdRecord = -1000
    var stopper = 1
    var stopper2 = 1
    for (var j = 0; (j < pfdmask.children.length); j++) {
        var allAz = Array.from(pfdmask.children[j].children)
        var minDiffAz = 10000000
        var negativeAz = allAz.filter((element) => {
            return element.attributes[0].value < 0
        })
        var positiveAz = allAz.filter((element) => {
            return element.attributes[0].value > 0
        })

        if (az > 0) {
            for (var k = 0; (k < positiveAz.length && stopper); k++) {
                var azimuth = +positiveAz[k].attributes[0].value
                if (Math.abs(azimuth - az) < minDiffAz && k != positiveAz.length - 1) {
                    minDiffAz = Math.abs(azimuth - az)
                } else {
                    var allEl = k == positiveAz.length - 1 ? positiveAz[positiveAz.length - 1].children : positiveAz[k - 1].children
                    var minDiffEl = 10000000
                    for (var l = 0; (l < allEl.length && stopper2); l++) {
                        var ell = +allEl[l].attributes[0].value
                        if (el > 0) {
                            if (Math.abs(el - ell) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(el - ell)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? allEl[allEl.length - 1].innerHTML : allEl[l - 1].innerHTML
                                stopper2 = 0
                            }
                        } else if (el <= 0) {
                            if (Math.abs(-ell - el) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(-ell - el)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? allEl[allEl.length - 1].innerHTML : allEl[l - 1].innerHTML
                                stopper2 = 0
                            }
                        }
                    }
                    stopper = 0
                }
            }
        } else if (az <= 0) {
            for (var k = 0; (k < negativeAz.length && stopper); k++) {
                var azimuth = +negativeAz[k].attributes[0].value
                if (Math.abs(azimuth - az) < minDiffAz && k != negativeAz.length - 1) {
                    minDiffAz = Math.abs(azimuth - az)
                } else {
                    var allEl = k == negativeAz.length - 1 ? negativeAz[negativeAz.length - 1].children : negativeAz[k - 1].children
                    var minDiffEl = 10000000
                    for (var l = 0; (l < allEl.length && stopper2); l++) {
                        var ell = +allEl[l].attributes[0].value // < 0
                        if (el > 0) {
                            if (Math.abs(ell + el) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(ell + el)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? allEl[allEl.length - 1].innerHTML : allEl[l - 1].innerHTML
                                stopper2 = 0
                            }
                        } else if (el <= 0) {
                            if (Math.abs(ell - el) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(ell - el)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? allEl[allEl.length - 1].innerHTML : allEl[l - 1].innerHTML
                                stopper2 = 0
                            }
                        }
                    }
                    stopper = 0
                }
            }
        }
    }

    return {
        pfdRecord: pfdRecord,
        az: az,
        el: el
    }
}

const epfdCalculator = (pfdmask, satPosition, esPosition, gr) => {
    var results = []
    for (var i = 0; i < satPosition.length; i = i + 1) {
        var { sx, sy, sz } = satPosition[i]
        var { ex, ey, ez, xg, yg, zg } = esPosition[i]
        var absx = Math.pow(sx - ex, 2)
        var absy = Math.pow(sy - ey, 2)
        var absz = Math.pow(sz - ez, 2)
        var d = Math.sqrt(absx + absy + absz)
        // console.log(d)
        //off axis angle... well
        var angle = offAxisCalculator(
            { x: sz, y: sy, z: sz },
            { x: ex, y: ey, z: ez },
            { x: xg, y: yg, z: zg })

        //earth station lookup table
        var grr = esGain(angle)
        var { pfdRecord, az, el } = pfd(pfdmask, satPosition[i], esPosition[i])
        var epfd = {
            grr: grr,
            e: +pfdRecord,
            d: d,
            iteration: i,
            es: esPosition[i],
            ss: satPosition[i],
            az: az,
            el: el
        }
        results.push(epfd)
    }

    return results
}


const passVisibility = (d, satPosition) => {
    var { sx, sy, sz } = satPosition
    var height = new Vector3(sx, sy, sz).distanceTo(new Vector3(0, 0, 0)) - Constant.radius

    var cond = Math.sqrt(height * (2 * Constant.radius + height))

    if (d < cond) {
        return true
    } else {
        return false
    }

}

const esGain = (angle, dish, lambda) => {
    var x = Math.round(dish / lambda)

    if (20 < x && x < 25) {
        var gmax = 20 * Math.log10(dish / lambda) + 7.7
        var g1 = 29 - 25 * Math.log10(96 * lambda / dish)
        var gamma = 20 * (lambda / dish) * Math.sqrt(gmax - g1)
        if (angle > 0 && angle < gamma) {
            return gmax - 0.0025 * Math.pow(dish * angle / lambda, 2)
        } else if (angle >= gamma && angle < (95 * lambda / dish)) {
            return g1
        } else if (angle >= (95 * lambda / dish) && angle < 33.1) {
            return 29 - 25 * Math.log10(angle)
        } else if (angle > 33.1 && angle <= 80) {
            return -9
        } else {
            return -5
        }
    } else if (25 < x && x < 100) {
        var gmax = 20 * Math.log10(dish / lambda) + 7.7
        var g1 = 29 - 25 * Math.log10(96 * lambda / dish)
        var gamma = 20 * (lambda / dish) * Math.sqrt(gmax - g1)
        if (angle > 0 && angle < gamma) {
            return gmax - 0.0025 * Math.pow(dish * angle / lambda, 2)
        } else if (angle >= gamma && angle < (95 * lambda / dish)) {
            return g1
        } else if (angle >= (95 * lambda / dish) && angle < 33.1) {
            return 29 - 25 * Math.log10(angle)
        } else if (angle > 33.1 && angle <= 80) {
            return -9
        } else if (angle > 80 && angle <= 120) {
            return -4
        } else {
            return -9
        }
    } else if (x > 100) {
        var gmax = 20 * Math.log10(dish / lambda) + 8.4
        var g1 = -1 + 15 * Math.log10(x)
        var gamma = 20 * (lambda / dish) * Math.sqrt(gmax - g1)
        var gammar = 15.85 * Math.pow(x, -0.6)
        if (angle > 0 && angle < gamma) {
            return gmax - 0.0025 * Math.pow(dish * angle / lambda, 2)
        } else if (angle >= gamma && angle < gammar) {
            return g1
        } else if (angle >= gammar && angle < 10) {
            return 29 - 25 * Math.log10(angle)
        } else if (angle > 10 && angle <= 34.1) {
            return 34 - 30 * Math.log10(angle)
        } else if (angle >= 34.1 && angle < 80) {
            return -12
        } else if (angle >= 80 && angle < 120) {
            return -7
        } else {
            return -12
        }
    } else {
        return 0
    }
}

function deg2Pi(x) {
    return x * Math.PI / 180;
}

export {
    TimeStepCalculator,
    generateSatEciPosition,
    generateESEciPosition,
    epfdCalculator,
    passVisibility,
    pfd
}