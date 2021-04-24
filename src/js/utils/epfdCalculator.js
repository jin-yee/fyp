const { Vector3 } = require('three')
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path')

const Constant = {
    radius: 6378.145, //km
    gso: 42164,
    segments: 64,
    miu: 398601.2, //km^3/sec^2
    omegae: Math.pow(4.1780745823, -3), //degree/s
    subSatellitePoints: 50,
    fff: 6 / Math.pow(4.166667, -3),
    j2: 0.001082636,
    TE: 86164.09054,
    lightSpeed: Math.pow(3, 8)
}

const TimeStepCalculator = (a, e, i, gso_es_3db, nhit) => {

    var inclination_deg = i,
        perigee = a * (1 - e),
        phi = 0.5 * gso_es_3db - (180 / Math.PI) * Math.asin(Math.sin(deg2Pi(0.5 * gso_es_3db)) * Constant.radius / (Constant.radius + perigee)), // degree
        omegas = 0.071 / Math.pow(1 + perigee / Constant.radius, 1.5), //degree/s
        omega = Math.sqrt(Math.pow(omegas * Math.cos(deg2Pi(inclination_deg)) - Constant.omegae, 2) + Math.pow(omegas * Math.sin(deg2Pi(inclination_deg)), 2)), //deg/s
        time_interval = 2 * phi / omega, // time interval when a NGSO sat passes through the main beam of a GSO ES antenna
        time_step = time_interval / nhit, // time increment of our simulation
        time_run = Math.abs(2 * Math.PI / (omegas - Constant.omegae)); // end time

    return {
        time_step: time_step,
        time_run: time_run,
    }
}

const generateSatandESEciPosition = (a, e, i, ww, OO, v, lon, lat, time_step) => {
    var positions = [];

    //GSO
    var lat_radian = deg2Pi(lat)
    var long_radian = deg2Pi(lon)
    var omegae_radian = deg2Pi(Constant.omegae)

    //NGSO
    var ii = deg2Pi(i) //radian
    var no = Math.sqrt(Constant.miu / Math.pow(a, 3)) //average angular rate rad/s
    var aa = Math.sqrt(1 - e * e) //unitless
    var b = 1 - 1.5 * Math.pow(Math.sin(ii), 2) // unitless
    var p = a * (1 - e * e)
    var c = 1.5 * Constant.j2 * Constant.radius * Constant.radius / Math.pow(p, 2)
    var lon = no * (1 + aa * b * c) //rad/s

    var Or = -c * lon * Math.cos(ii) //rad/s
    var wr = c * lon * (2 - 2.5 * Math.pow(Math.sin(ii), 2))
    var orbitPeriod = 2 * Math.PI / (wr + lon)

    var xs, ys, zs, R, xe, ye, ze, xg, yg, zg
    for (var t = 0; t < 86400; t = t + time_step) { //run for one day

        //NGSO
        var w = deg2Pi(ww) + wr * t //rad
        var O = deg2Pi(OO) + Or * t //rad
        var E = 2 * Math.atan(Math.tan(deg2Pi(v / 2)) / Math.sqrt((1 + e) / (1 - e))) //rad
        var M = E - e * Math.sin(E) //rad
        var ta = M + lon * t //rad
        // var ta = this.satrec.mo + (2 * this.satrec.ecco - 0.25 * Math.pow(this.satrec.ecco, 3) * Math.sin(this.satrec.mo) + 1.25 * Math.pow(this.satrec.ecco, 2) * Math.sin(2 * this.satrec.mo))

        R = p / (1 + e * Math.cos(ta))
        xs = R * (Math.cos(ta + w) * Math.cos(O) - Math.sin(ta + w) * Math.sin(O) * Math.cos(ii))
        ys = R * (Math.cos(ta + w) * Math.sin(O) + Math.sin(ta + w) * Math.cos(O) * Math.cos(ii))
        zs = R * (Math.sin(ta + w) * Math.sin(ii))

        //GSO
        xe = Constant.radius * (Math.cos(lat_radian) * Math.cos(long_radian + omegae_radian * t))
        ye = Constant.radius * (Math.cos(lat_radian) * Math.sin(long_radian + omegae_radian * t))
        ze = Constant.radius * Math.sin(lat_radian)
        xg = (Constant.radius + Constant.gso) * (Math.cos(lat_radian) * Math.cos(long_radian + omegae_radian * t))
        yg = (Constant.radius + Constant.gso) * (Math.cos(lat_radian) * Math.sin(long_radian + omegae_radian * t))
        zg = (Constant.radius + Constant.gso) * Math.sin(lat_radian)

        positions.push({
            xs: xs,
            ys: ys,
            zs: zs,
            xe: xe,
            ye: ye,
            ze: ze,
            xg: xg,
            yg: yg,
            zg: zg,
            T: orbitPeriod
        })
    }

    return positions
}

const offAxisCalculator = (satpos, gpos, espos) => {

    var vs, vg
    vs = new Vector3(satpos.x - espos.x, satpos.y - espos.y, satpos.z - espos.z)
    vg = new Vector3(gpos.x - espos.x, gpos.y - espos.y, gpos.z - espos.z)

    return vs.angleTo(vg) * (180 / Math.PI) //degree
}

const pfd = (pfdmask, satpos, espos) => {
    var d = new Vector3(satpos.x, satpos.y, satpos.z).distanceTo(new Vector3(espos.x, espos.y, espos.z))
    var az = Math.atan((espos.x - satpos.x) / (espos.y - satpos.y)) * 180 / Math.PI
    var el = Math.asin((espos.z - satpos.z) / d) * 180 / Math.PI

    var mask = pfdmask.satellite_system.pfd_mask
    var allAz = mask[0].by_a[0].by_b
    var azimuthArrayLength = mask[0].by_a[0].by_b.length
    var pfdRecord = -1000
    var stopper = 1
    var stopper2 = 1

    var negativeAz = allAz.filter(element => { return Number(element.$.b) < 0 })
    var positiveAz = allAz.filter((element) => { return Number(element.$.b) > 0 })

    for (var j = 0; (j < azimuthArrayLength); j++) {
        var minDiffAz = 10000000
        if (az > 0) {
            for (var k = 0; (k < positiveAz.length && stopper); k++) {
                var azimuth = Number(positiveAz[k].$.b)
                if (Math.abs(azimuth - az) < minDiffAz && k != positiveAz.length - 1) {
                    minDiffAz = Math.abs(azimuth - az)
                } else {
                    var allEl = k == positiveAz.length - 1 ? positiveAz[positiveAz.length - 1].pfd : positiveAz[k - 1].pfd
                    var minDiffEl = 10000000
                    for (var l = 0; (l < allEl.length && stopper2); l++) {
                        var ell = Number(allEl[l].$.c)
                        if (el > 0) {
                            if (Math.abs(el - ell) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(el - ell)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? Number(allEl[allEl.length - 1]._) : Number(allEl[l - 1]._)
                                stopper2 = 0
                            }
                        } else if (el <= 0) {
                            if (Math.abs(-ell - el) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(-ell - el)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? Number(allEl[allEl.length - 1]._) : Number(allEl[l - 1]._)
                                stopper2 = 0
                            }
                        }
                    }
                    stopper = 0
                }
            }
        } else if (az <= 0) {
            for (var k = 0; (k < negativeAz.length && stopper); k++) {
                var azimuth = Number(negativeAz[k].$.b)
                if (Math.abs(azimuth - az) < minDiffAz && k != negativeAz.length - 1) {
                    minDiffAz = Math.abs(azimuth - az)
                } else {
                    var allEl = k == negativeAz.length - 1 ? negativeAz[negativeAz.length - 1].pfd : negativeAz[k - 1].pfd
                    var minDiffEl = 10000000
                    for (var l = 0; (l < allEl.length && stopper2); l++) {
                        var ell = Number(allEl[l].$.c) // < 0
                        if (el > 0) {
                            if (Math.abs(ell + el) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(ell + el)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? Number(allEl[allEl.length - 1]._) : Number(allEl[l - 1]._)
                                stopper2 = 0
                            }
                        } else if (el <= 0) {
                            if (Math.abs(ell - el) < minDiffEl && l != allEl.length - 1) {
                                minDiffEl = Math.abs(ell - el)
                            } else {
                                pfdRecord = l == allEl.length - 1 ? Number(allEl[allEl.length - 1]._) : Number(allEl[l - 1]._)
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
        d: d,
        az: az,
        el: el
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

const passVisibility = (d, satPosition) => {
    var { xs, ys, zs } = satPosition
    var height = new Vector3(xs, ys, zs).distanceTo(new Vector3(0, 0, 0)) - Constant.radius
    var cond = Math.sqrt(height * (2 * Constant.radius + height))

    if (d < cond) {
        return true
    } else {
        return false
    }
}

function deg2Pi(x) {
    return (x * Math.PI) / 180
}

const epfdCalculator = (epfdInput, apppath) => {
    var results = []
    return new Promise((resolve, reject) => {

        try {
            var { a, e, i, O, w, v, f, nhit, gr, mask, lambda, dish, delta3db, lon, lat } = epfdInput
            var csvtext;
            //need to rewrite the xml parser

            var { time_step, time_run } = TimeStepCalculator(a, e, i, delta3db, nhit)
            var positions = generateSatandESEciPosition(a, e, i, w, O, v, lon, lat, time_step)
            var visiblePosition = positions.filter((position, index) => {

                var { xs, ys, zs, xe, ye, ze } = position
                var absx = Math.pow(xs - xe, 2)
                var absy = Math.pow(ys - ye, 2)
                var absz = Math.pow(zs - ze, 2)
                var d = Math.sqrt(absx + absy + absz)
                return passVisibility(d, { xs: xs, ys: ys, zs: zs })
            })

            for (var i = 0; i < visiblePosition.length; i = i + 1) {
                // for (var i = 0; i < 2; i = i + 1) {
                var ngsoSatPos = { x: visiblePosition[i].xs, y: visiblePosition[i].ys, z: visiblePosition[i].zs }
                var gsoESPos = { x: visiblePosition[i].xe, y: visiblePosition[i].ye, z: visiblePosition[i].ze }
                var gsoSatPos = { x: visiblePosition[i].xg, y: visiblePosition[i].yg, z: visiblePosition[i].zg }

                //off axis angle... well
                var angle = offAxisCalculator(ngsoSatPos, gsoESPos, gsoSatPos)

                //earth station lookup table
                var grr = esGain(angle, dish, lambda)

                var { pfdRecord, d, az, el } = pfd(mask, ngsoSatPos, gsoESPos)
                var epfd = {
                    gr: gr,
                    angle: angle,
                    grr: grr,
                    e: pfdRecord,
                    d: d,
                    iteration: i,
                    es: ngsoSatPos,
                    ss: gsoESPos,
                    az: az,
                    el: el
                }
                results.push(epfd)
                csvtext += `${epfd.es.x},${epfd.es.y}, ${epfd.es.z}, ${epfd.ss.x},${epfd.ss.y},${epfd.ss.z}, ${epfd.e}, ${epfd.grr}, ${epfd.gr}, ${epfd.d}\n`
            }
            var csvtitle = 'ES Loc x, ES Loc y, ES Loc z, NGSO Sat Loc x, NGSO Sat Loc y, NGSO Sat Loc z, epfd, G(Phi), Gmax, d\n'
            fs.writeFileSync(path.join(apppath,'data.csv'), csvtitle + csvtext)
            resolve('ok')
        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

module.exports = {
    generateSatandESEciPosition,
    epfdCalculator,
    pfd
}