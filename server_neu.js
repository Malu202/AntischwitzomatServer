var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var push = require('./push-notifications')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

db.serialize(function () {
    if (!exists) {
        db.run(`CREATE TABLE Sensors (
            sensor_id INTEGER PRIMARY KEY
        );`);

        db.run(`CREATE TABLE Measurements (
            sensor_id DECIMAL NOT NULL,
            time DATETIME NOT NULL,
            temperature DECIMAL,
            humidity DECIMAL,
            pressure DECIMAL,
            FOREIGN KEY (sensor_id) REFERENCES Sensors(sensor_id)
        );`);

        db.run(`CREATE TABLE Rooms (
            room_id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT,
            sensor_id1 DECIMAL NOT NULL,
            sensor_id2 DECIMAL,
            FOREIGN KEY (user_id) REFERENCES Users (user_id),
            FOREIGN KEY (sensor_id1) REFERENCES Sensors (sensor_id),
            FOREIGN KEY (sensor_id2) REFERENCES Sensors (sensor_id)        
        );`);

        db.run(`CREATE TABLE Users (
            user_id INTEGER PRIMARY KEY
        );`);

        db.run(`CREATE TABLE Notifications (
            notification_id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            type TEXT,
            value TEXT NOT NULL,
            room_id1 INTEGER NOT NULL,
            room_id2 INTEGER,
            amount INTEGER,
            message TEXT,
            endpoint TEXT NOT NULL,
            key_p256dh TEXT NOT NULL,
            key_auth TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users (user_id),
            FOREIGN KEY (room_id1) REFERENCES Rooms (room_id),
            FOREIGN KEY (room_id2) REFERENCES Rooms (room_id)
        );`);
    }
});


app.get('/measurements', function (request, response) {
    db.all('SELECT * from Measurements', function (err, rows) {
        response.send(JSON.stringify(rows));
    });
});

app.post('/measurements', function (request, response) {
    var sensor_id = request.body.i;
    var temp = request.body.t / 100;
    var hum = request.body.h / 100;
    var pres = request.body.p / 10000;
    var date = request.body.d;
    var date = new Date(date);
    response.send("saved " + temp + " " + hum + " " + pres + " at " + sqllite_date);
    console.log(request.body);

    if (isNaN(date.getMilliseconds())) {
        date = new Date();
    }
    var sqllite_date = date.toISOString();

    //if(id==null) create new id
    addNewId("SENSORS", "sensor_id", sensor_id, function (err, newSensorId) {
        //db.run("INSERT INTO Sensors (sensor_id)  VALUES ((?))", [sensor_id]);
        // addNewMeasurement(newSensorId, sqllite_date, temp, hum, pres);
        db.serialize(function () {
            db.run('INSERT INTO Measurements (time, temperature, humidity, pressure, sensor_id) VALUES ((?),(?),(?),(?),(?))', [sqllite_date, temp, hum, pres, sensor_id]);

            db.all('SELECT room_id from Rooms WHERE sensor_id1=(?) OR sensor_id2=(?)', [sensor_id, sensor_id], function (err, room_ids) {
                console.log("updating " + room_ids.length + " rooms");
                for (let i = 0; i < room_ids.length; i++) {
                    let roomId = room_ids[i].room_id;
                    db.all('SELECT * from Notifications WHERE room_id1=(?) OR room_id2=(?)', [roomId, roomId], function (err, notifications) {
                        console.log("checking " + notifications.length + " notifications");


                        for (let i = 0; i < notifications.length; i++) {
                            checkNotification(notifications[i]);
                        }
                    });
                }
            });
        });
    });
});

app.delete('/measurements', function (request, response) {
    db.run('DELETE FROM Sensors');
    db.run('DELETE FROM Measurements');
    db.run('DELETE FROM Rooms');
    db.run('DELETE FROM Users');
    db.run('DELETE FROM Notifications');
    response.send("deleted database");
});


app.get('/roommeasurements', function (request, response) {
    // let roomsStrings = [];
    // roomsStrings = roomsStrings.concat(request.query.rooms);
    // let rooms = [];
    // for (let i = 0; i < roomsStrings.length; i++) {
    //     let roomId = parseInt(roomsStrings[i]);
    //     if (!isNaN(roomId) && roomId != null && roomId != undefined) {
    //         rooms.push(roomId);
    //     }
    // }

    // let arguments = rooms.map(function () { return '(?)' }).join(',');
    // db.all(`SELECT * from Rooms WHERE room_id IN (${arguments})`, rooms, function (err, rows) {
    //     if (err) console.log(err);
    //     if (rooms.length == 0) response.send("no roomIds in url query");

    //     let output = {};
    //     for (let i = 0; i < rows.length; i++) {
    //         getRoomValues(rows[i], false, function (values) {
    //             output[rows[i].room_id] = values;
    //             if (Object.keys(output).length == rows.length) response.send(output);
    //         })
    //     }
    // });
    let user_id = request.query.user_id;
    db.all(`SELECT * from Rooms WHERE user_id=(?)`, [user_id], function (err, rows) {
        if (err) {
            console.log(err);
            response.send(err)
        } else if (rows.length == 0) response.send("No Rooms for this user_id");
        else {
            let output = {};
            for (let i = 0; i < rows.length; i++) {
                getRoomValues(rows[i], false, function (values) {
                    output[rows[i].room_id] = values;
                    if (Object.keys(output).length == rows.length) response.send(output);
                })
            }
        }
    });
});


var listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});

function checkNotification(notification) {
    let type = notification.type.toLowerCase().replace(" ", "");
    let value = notification.value.toLowerCase().replace(" ", "");
    let room_id1 = notification.room_id1;
    let room_id2 = notification.room_id2;
    let amount = notification.amount;
    let message = notification.message;

    let room1Value;
    let room2Value;
    db.serialize(function () {
        db.all('SELECT * from Rooms WHERE room_id=(?) OR room_id=(?)', [room_id1, room_id2], function (err, room) {
            getRoomValues(room[0], true, function (room1Values) {
                getRoomValues(room[1], true, function (room2Values) {

                    let room1Value = room1Values[0][value];
                    let room2Value = null;

                    if (room_id2 != null) {
                        room2Value = room2Values[0][value];
                    }

                    console.log("room1: " + room1Value);
                    console.log("room2: " + room2Value);
                    switch (type) {
                        case "greaterthan":
                            if (room_id2 == null && room1Value > amount) {
                                sendNotification(notification)
                            } else if (room1Value > (room2Value + amount)) {
                                sendNotification(notification)
                            }
                            break;
                        case "lessthan":
                            if (room_id2 == null && room1Value < amount) {
                                sendNotification(notification)
                            } else if (room1Value < (room2Value - amount)) {
                                sendNotification(notification)
                            }
                            break;

                        default:
                            break;
                    }

                });
            });
        });
    });
}

function sendNotification(notification) {
    console.log("sending notification")
    push.send(notification.message, {
        endpoint: notification.endpoint,
        keys: {
            p256dh: notification.key_p256dh,
            auth: notification.key_auth
        }
    })
}

function getRoomValues(room, latestOnly, cb) {
    if (room == null) {
        cb(null);
        return;
    }

    let room_id = room.room_id;
    let type = room.type.toLowerCase();
    let sensor_id1 = room.sensor_id1;
    let sensor_id2 = room.sensor_id2;

    let query = 'SELECT sensor_id, time, temperature, humidity, pressure from Measurements WHERE sensor_id=(?) OR sensor_id=(?) ORDER BY sensor_id, time;'
    if (latestOnly) query = 'SELECT sensor_id, max(time), temperature, humidity, pressure from Measurements WHERE sensor_id=(?) OR sensor_id=(?) GROUP BY sensor_id'
    db.all(query, [sensor_id1, sensor_id2], function (err, measurements) {
        if (err) {
            console.log(err);
            cb(err, null)
        }
        if (latestOnly) {
            for (let i = 0; i < measurements.length; i++) {
                measurements[i].time = measurements[i]['max(time)'];
                delete measurements[i]['max(time)'];
            }
        }
        if (sensor_id2 == null && !err) {
            for (let i = 0; i < measurements.length; i++) {
                delete measurements[i].sensor_id;
                measurements[i].room_id = room_id;
            }
            cb(measurements);
        } else {
            if (measurements.length == 0) cb("No measurements in database", null)
            let sensor1Measurements = [];
            let sensor2Measurements = [];

            //Database returns values for both sensors in one json, now we split
            let firstSensorId = measurements[0].sensor_id;
            for (let i = 0; i < measurements.length; i++) {
                if (measurements[i].sensor_id != firstSensorId || i == measurements.length - 1) {
                    sensor1Measurements = measurements.slice(0, i);
                    sensor2Measurements = measurements.slice(i);

                    break;
                }
            }

            let sensor2MeasurementsInterpolated = [];
            let sensor2Index = 0;
            for (let i = 0; i < sensor1Measurements.length; i++) {
                let temperature, humidity, pressure;

                let sensor1Date = new Date(sensor1Measurements[i].time);
                for (let j = sensor2Index; j < sensor2Measurements.length; j++) {
                    let sensor2Date = new Date(sensor2Measurements[j].time);
                    if (sensor2Date.getTime() > sensor1Date.getTime()) {
                        if (j == 0) {
                            temperature = sensor2Measurements[j].temperature;
                            humidity = sensor2Measurements[j].humidity;
                            pressure = sensor2Measurements[j].pressure;
                        } else {
                            let previousSensor2Date = new Date(sensor2Measurements[j - 1].time);
                            let interpolationFactor = (sensor2Date.getTime() - sensor1Date.getTime()) / (sensor2Date.getTime() - previousSensor2Date.getTime());
                            temperature = sensor2Measurements[j].temperature + (sensor2Measurements[j].temperature - sensor2Measurements[j - 1].temperature) * interpolationFactor;
                            humidity = sensor2Measurements[j].humidity + (sensor2Measurements[j].humidity - sensor2Measurements[j - 1].humidity) * interpolationFactor;
                            pressure = sensor2Measurements[j].pressure + (sensor2Measurements[j].pressure - sensor2Measurements[j - 1].pressure) * interpolationFactor;
                        }
                        sensor2MeasurementsInterpolated.push({ /*sensor_id: sensor2Measurements.sensor_id,*/ time: sensor1Measurements[i].time, "temperature": temperature, "humidity": humidity, "pressure": pressure });
                        break;
                    }
                    if (j == sensor2Measurements.length - 1 && sensor2Date.getTime() < sensor1Date.getTime()) {
                        temperature = sensor2Measurements[j].temperature;
                        humidity = sensor2Measurements[j].humidity;
                        pressure = sensor2Measurements[j].pressure;
                        sensor2MeasurementsInterpolated.push({ sensor_id: sensor2Measurements.sensor_id, time: sensor1Measurements[i].time, "temperature": temperature, "humidity": humidity, "pressure": pressure });
                        break;
                    }
                    sensor2Index = j;
                }
            }

            switch (type) {
                case "average":
                    cb(averageMeasurement(room_id, sensor1Measurements, sensor2MeasurementsInterpolated));
                    break;
                default:
                    break;
            }
        }
    })
}


function averageMeasurement(roomId, data1, data2) {
    if (data1.length != data2.length) {
        let e = new Error("for averaging measurements both data arrays need to be of same length")
        console.log(e);
        return e;
    }
    let output = [];
    for (let i = 0; i < data1.length; i++) {
        output.push({
            "roomId": roomId,
            time: data1[i].time,
            temperature: (data1[i].temperature + data2[i].temperature) * 0.5,
            humidity: (data1[i].humidity + data2[i].humidity) * 0.5,
            pressure: (data1[i].pressure + data2[i].pressure) * 0.5,
        });
    }
    return output;
}

app.get('/s', function (req, res) {
    db.all('SELECT * from Notifications', function (err, rows) {
        let notifications = rows;
        console.log(notifications)
        for (let i = 0; i < notifications.length; i++) {
            push.send("howdy", {
                endpoint: notifications[i].endpoint,
                keys: {
                    p256dh: notifications[i].key_p256dh,
                    auth: notifications[i].key_auth
                }
            })
        };
        res.send("sent " + notifications.length + " request(s)")
    });
})

app.post('/notifications', function (req, res) {
    let user_id = req.body.user_id;
    addNewNotification(res,
        user_id,
        req.body.type,
        req.body.value,
        req.body.room_id1,
        req.body.room_id2,
        req.body.amount,
        req.body.message,
        req.body.endpoint,
        req.body.keys.p256dh,
        req.body.keys.auth);
});

app.post('/rooms', function (req, res) {
    let user_id = req.body.user_id;
    addNewId("Users", "user_id", user_id, function (err, id) {
        if (err) res.send(err);
        db.run(`INSERT INTO Rooms(user_id, name, type, sensor_id1, sensor_id2)
                VALUES((?),(?),(?),(?),(?))`,
            [id, req.body.name, req.body.type, req.body.sensor_id1, req.body.sensor_id2], function (err) {
                if (err) console.log(err);
                res.send({ "user_id": id, error: err });
            });
    });
});
app.get('/rooms', function (req, res) {
    let user_id = req.query.user_id;
    db.all('SELECT * from Rooms WHERE user_id=(?)', [user_id], function (err, rows) {
        res.send(JSON.stringify(rows));
    });
});
app.delete('/rooms', function (req, res) {
    let room_id = req.query.room_id;
    db.all('DELETE from Rooms WHERE room_id=(?);', [room_id], function (err, rows) {
        if (err) console.log(err)
        res.send(JSON.stringify(err));
    });
});
app.get('/sensors', function (req, res) {
    db.all('SELECT * from Sensors', function (err, rows) {
        res.send(JSON.stringify(rows));
    });
});
app.get('/notifications', function (req, res) {
    let user_id = req.query.user_id;
    db.all(`SELECT
    notification_id,
    type,
    value,
    room_id1,
    room_id2,
    amount,
    message
    FROM Notifications WHERE user_id=(?);`, [user_id], function (err, rows) {
        if (err) console.log(err)
        res.send(JSON.stringify(rows));
    });
});
app.delete('/notifications', function (req, res) {
    let notification_id = req.query.notification_id;
    db.all('DELETE from Notifications WHERE notification_id=(?);', [notification_id], function (err, rows) {
        if (err) console.log(err)
        res.send(JSON.stringify(err));
    });
});
function addNewId(table, column, id, cb) {
    if (id == undefined || id == "undefined" || id == "null") id = null;
    db.run(`INSERT INTO ${table}(${column}) VALUES(?)`, id,
        function (err) {
            if (err) {
                if (err.errno != 19) {
                    console.log(`error when adding id ${column} into ${table}`)
                    console.log(err);
                    cb(err, null)
                } else {
                    err = null;
                    console.log(`Existing id (${column}): ` + id + " returned");
                }
            } else {
                console.log(`New id (${column}): ` + this.lastID);
                id = this.lastID
            }
            cb(err, id);
        });
}

function addNewNotification(res, user_id, type, value, room_id1, room_id2, amount, message, endpoint, key_p256dh, key_auth) {
    addNewId("Users", "user_id", user_id, function (err, id) {
        if (err) {
            res.send(err)
            console.log(err)
        }
        else {
            db.run(`INSERT INTO Notifications (user_id, type, value, room_id1, room_id2, amount, message, endpoint, key_p256dh, key_auth)
        VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?))`,
                [id, type, value, room_id1, room_id2, amount, message, endpoint, key_p256dh, key_auth], function (err2) {
                    console.log(err2)
                    res.send({ "user_id": id, error: err2, notification_id: this.lastID });
                });
        }
    });
}




app.get('/mockup', function (request, response) {
    response.sendFile(__dirname + "/sampleDay_spikes.json");
});

app.get('/mockup2', function (request, response) {
    response.sendFile(__dirname + "/sampleDay_fewSpikes.json");
});