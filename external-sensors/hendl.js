const fetch = require("node-fetch");

class HendlSensor {
    constructor() {
        this._sensorMap = [
            {
                sensor_id: 103,
                embeddableId: "a232bd7e813046cebfec865018cc839e"
            }
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
            let measurements = [];
            for (let s of this._sensorMap) {
                let res = await fetch(`https://www.weatherlink.com/embeddablePage/getData/${s.embeddableId}`);
                let data = await res.json();
                measurements.push({
                    sensor_id: s.sensor_id,
                    measurement: {
                        temperature: parseFloat(data.temperature),
                        humidity: parseFloat(data.humidity),
                        pressure: parseFloat(data.barometer),
                        time: new Date()
                    }
                });
            }
            return measurements;
        }
        catch (err) {
            console.error("Could not get Hendl Sensor data", err);
            return [];
        }
    }
}

module.exports = {
    HendlSensor
};