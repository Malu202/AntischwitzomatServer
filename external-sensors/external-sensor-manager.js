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

    async update() {
        let measurements = [];
        for (let s of this._externalSensors) {
            var anyExpired = (await Promise.all(s.getSensorIds().map(id => this.checkExpiration(id, s.getMeasurementIntervalSeconds())))).some(d => d);
            if (anyExpired) {
                measurements = [...measurements, ...(await s.getMeasurements())];
            }
        }
        return measurements;
    }
}

module.exports = {
    ExternalSensorManager
};