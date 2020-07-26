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
            time DATETIME NOT NULL,
            temperature DECIMAL,
            humidity DECIMAL,
            pressure DECIMAL,
            sensor_id DECIMAL NOT NULL,
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

    if (isNaN(date.getMilliseconds())) {
        date = new Date();
    }
    var sqllite_date = date.toISOString();

    //if(id==null) create new id
    db.run("INSERT INTO Sensors (sensor_id)  VALUES ((?))", [sensor_id]);
    response.send("saved " + temp + " " + hum + " " + pres + " at " + sqllite_date);
    addNewMeasurement(sensor_id, sqllite_date, temp, hum, pres);
    checkNotifications(sqllite_date, sensor_id, temp, hum, pres);
    console.log(request.body);
});

app.delete('/measurements', function (request, response) {
    db.run('DELETE FROM Sensors');
    db.run('DELETE FROM Measurements');
    db.run('DELETE FROM Rooms');
    db.run('DELETE FROM Users');
    db.run('DELETE FROM Notifications');
    response.send("deleted database");
});

function addNewMeasurement(sensor_id, time, temperature, humidity, pressure) {
    const dataString = '"' + time + '", "' + temperature + '", "' + humidity + '", "' + pressure + '"';
    console.log("saving: " + dataString);
    db.serialize(function () {
        db.run('INSERT INTO Measurements (time, temperature, humidity, pressure, sensor_id) VALUES ((?),(?),(?),(?),(?))', [time, temperature, humidity, pressure, sensor_id]);
    });
}

var listener = app.listen(/*process.env.PORT*/ 1337, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});

function checkNotifications() {
    //TODO
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
    console.log(req.body);
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
            [user_id, req.body.name, req.body.type, req.body.sensor_id1, req.body.sensor_id2], function (err) {
                if (err) console.log(err);
                res.send({ "user_id": user_id, error: err });
            });
    });
});
app.get('/rooms', function (req, res) {
    let user_id = req.body.user_id;
    db.all('SELECT * from Rooms WHERE user_id=(?)', [user_id], function (err, rows) {
        response.send(JSON.stringify(rows));
    });
});
app.get('/sensors', function (req, res) {
    db.all('SELECT * from Sensors', function (err, rows) {
        response.send(JSON.stringify(rows));
    });
});
app.get('/notifications', function (req, res) {
    let user_id = req.body.user_id;
    db.all('SELECT * from Notifications WHERE user_id=(?)', [user_id], function (err, rows) {
        response.send(JSON.stringify(rows));
    });
});

function addNewId(table, column, id, cb) {
    db.run(`INSERT INTO ${table}(${column}) VALUES(?)`, id,
        function (err) {
            if (err) {
                if (err.errno != 19) {
                    console.log(err);
                    cb(err, null)
                } else {
                    err = null;
                    console.log("Existing user (" + id + ") registered a notification");
                }
            } else {
                console.log("New user with id: " + this.lastID);
                id = this.lastID
            }
            cb(err, id);
        });
}

function addNewNotification(res, user_id, type, value, room_id1, room_id2, amount, message, endpoint, key_p256dh, key_auth) {
    addNewId("Users", "user_id", user_id, function (err, id) {
        console.log("hiho: " + err)
        if (err) res.send(err)
        else {
            db.run(`INSERT INTO Notifications (user_id, type, value, room_id1, room_id2, amount, message, endpoint, key_p256dh, key_auth)
        VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?))`,
                [id, type, value, room_id1, room_id2, amount, message, endpoint, key_p256dh, key_auth], function (err2) {
                    console.log(err2)
                    res.send({ "user_id": id, error: err2.stack });
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