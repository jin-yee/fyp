const Constant = {
    radius: 6378.145, //km
    segments: 64,
    miu: 398601.2, //km^3/sec^2
    omegae: Math.pow(4.1780745823, -3), //degree/s
    subSatellitePoints: 50,
    fff: 6 / Math.pow(4.166667, -3),
    j2: 0.001082636,
    TE: 86164.09054,
    lightSpeed: 3* Math.pow(10, 8),
    simulation : 0,
    Visualize: () => {
        if(Constant.simulation == 1)
            Constant.simulation = 0
        else
            Constant.simulation = 1
    }
}

export default Constant