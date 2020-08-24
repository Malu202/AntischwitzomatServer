const fetch = require("node-fetch");

class OpenWeatherMapSensor {
    constructor(apiKey) {
        if (apiKey) {
            this._sensorMap = [
                {
                    sensor_id: 102,
                    lat: 48.229929,
                    lon: 16.452690
                },
                {
                    sensor_id: 104,
                    lat: 48.194326,
                    lon: 16.406072
                },
            ];
        }
        else {
            this._sensorMap = [];
        }
        this._apiKey = apiKey;
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
                let res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${s.lat}&lon=${s.lon}&appid=${this._apiKey}&units=metric`);
                let data = await res.json();
                measurements.push({
                    sensor_id: s.sensor_id,
                    measurement: {
                        temperature: data.main.temp,
                        humidity: data.main.humidity,
                        pressure: data.main.pressure,
                        time: new Date()
                    }
                });
            }
            return measurements;
        }
        catch{
            console.error("Could not get Open Weather Map data");
            return [];
        }
    }
}

module.exports = {
    OpenWeatherMapSensor
};