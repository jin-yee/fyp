const { epfdCalculator } = require('../js/utils/epfdCalculator')
const { workerData, parentPort } = require('worker_threads')

const runla = async (workerData) => {
    var result = await epfdCalculator(workerData, workerData.appPath)
    parentPort.postMessage({ message: "done" })
}

runla(workerData)