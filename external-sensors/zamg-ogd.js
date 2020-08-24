const fetch = require("node-fetch");

class ZamgOgdSensor {
    constructor() {
        this._sensorMap = [
            {
                sensor_id: 100,
                zamgName: "Wien/Hohe Warte"
            },
            {
                sensor_id: 101,
                zamgName: "Wien/Schwechat"
            },
        ];
    }

    getSensorIds() {
        return this._sensorMap.map(v => v.sensor_id);
    }

    getMeasurementIntervalSeconds() {
        return 900;
    }

    async getMeasurements() {
        try {
            let res = await fetch("http://www.zamg.ac.at/ogd/");
            let text = await res.text();
            let sensors = text.split("\n");
            let measurements = [];
            for (let s of sensors.slice(1)) {
                let cols = s.split(";");
                if (cols.length < 15) {
                    continue;
                }
                try {
                    let mapped = this._sensorMap.find(m => m.zamgName == cols[1].replace(/"/g, ""));
                    if (mapped) {
                        measurements.push({
                            sensor_id: mapped.sensor_id,
                            measurement: {
                                temperature: cols[5] ? parseFloat(cols[5].replace(/,/g, ".")) : null,
                                humidity: cols[7] ? parseFloat(cols[7].replace(/,/g, ".")) : null,
                                pressure: cols[14] ? parseFloat(cols[14].replace(/,/g, ".")) : null,
                                time: new Date()
                            }
                        });
                    }
                }
                catch {
                    console.error("Could not parse ZAMG data");
                    continue;
                }
            }
            return measurements;
        }
        catch{
            console.error("Could not get ZAMG data");
            return [];
        }
    }
}

module.exports = {
    ZamgOgdSensor
};