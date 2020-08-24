class ExternalSensorManager {
    constructor(externalSensors, db) {
        this._externalSensors = externalSensors;
        this._db = db;
        this.update = this.update.bind(this);
    }

    checkExpiration(sensorId, interval) {
        let db = this._db;
        return new Promise((resolve) => {
            db.serialize(function () {
                db.all('SELECT time FROM Measurements WHERE sensor_id =(?) order by time desc limit 1', [sensorId], function (err, rows) {
                    if (!rows.length || (new Date() - new Date(rows[0].time)) >= interval * 1000) {
                        resolve(true);
                    }
                    resolve(false);
                });
            });
        });
    }

    insertMeasurement(m) {
        let db = this._db;
        return new Promise(resolve => {
            db.serialize(function () {
                db.all('SELECT sensor_id FROM SENSORS WHERE sensor_id =(?)', [m.sensor_id], function (err, rows) {
                    if (!rows.length) {
                        db.run('INSERT INTO SENSORS (sensor_id) VALUES ((?))', [m.sensor_id]);
                    }
                    db.run('INSERT INTO Measurements (time, temperature, humidity, pressure, sensor_id) VALUES ((?),(?),(?),(?),(?))',
                        [m.measurement.time.toISOString(), m.measurement.temperature, m.measurement.humidity, m.measurement.pressure, m.sensor_id]);
                    resolve();
                });
            });
        });
    }

    async update() {
        for (let s of this._externalSensors) {
            var anyExpired = (await Promise.all(s.getSensorIds().map(id => this.checkExpiration(id, s.getMeasurementIntervalSeconds())))).some(d => d);
            if (anyExpired) {
                let measurements = await s.getMeasurements();
                await Promise.all(measurements.map(m => this.insertMeasurement(m)));
            }
        }
    }
}

module.exports = {
    ExternalSensorManager
};