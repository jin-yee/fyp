import axios from 'axios'

export function downlinkHandler(e) {
    var formEle = document.getElementById('downlink-budget').elements
    var downlinkParam = {}
    for (var i = 0; i < formEle.length; i++) {
        downlinkParam[formEle[i].name] = formEle[i].value
    }

    axios({
        baseURL: 'http://localhost:3000',
        method: 'post',
        url: '/lb/down',
        data: downlinkParam
    }).then(res => {
        console.log(res)
    })
}

export function uplinkHandler(e) {
    var formEle = document.getElementById('uplink-budget').elements
    var uplinkParam = {}
    for (var i = 0; i < formEle.length; i++) {
        uplinkParam[formEle[i].name] = formEle[i].value
    }

    axios({
        baseURL: 'http://localhost:3000',
        method: 'post',
        url: '/lb/up',
        data: uplinkParam
    }).then(res => {
        console.log(res)
    })
}
