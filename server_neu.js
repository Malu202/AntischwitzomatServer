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
            time DATETIME,
            temperature DECIMAL,
            humidity DECIMAL,
            pressure DECIMAL,
            sensor_id DECIMAL,
            FOREIGN KEY (sensor_id) REFERENCES Sensors(sensor_id)
        );`);

        db.run(`CREATE TABLE Rooms (
            room_id INTEGER PRIMARY KEY,
            name TEXT,
            type TEXT,
            sensor_id1 DECIMAL,
            sensor_id2 DECIMAL,
            FOREIGN KEY (sensor_id1) REFERENCES Sensors (sensor_id),
            FOREIGN KEY (sensor_id2) REFERENCES Sensors (sensor_id)        
        );`);

        db.run(`CREATE TABLE Notifications (
            user_id INTEGER PRIMARY KEY NOT NULL,
            type TEXT,
            value TEXT,
            room_id1 INTEGER,
            room_id2 INTEGER,
            amount INTEGER,
            endpoint TEXT,
            key_p256dh TEXT,
            key_auth TEXT,
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
    db.run('DELETE FROM Measurements');
    response.send("deleted database");
});

function addNewMeasurement(sensor_id, time, temperature, humidity, pressure) {
    const dataString = '"' + time + '", "' + temperature + '", "' + humidity + '", "' + pressure + '"';
    console.log("saving: " + dataString);
    db.serialize(function () {
        db.run('INSERT INTO Measurements (time, temperature, humidity, pressure, sensor_id) VALUES ((?),(?),(?),(?),(?))', [time, temperature, humidity, pressure, sensor_id]);
    });
}

app.get('/stations', function (request, response) {
    db.all('SELECT * from Stations', function (err, rows) {
        response.send(JSON.stringify(rows));
    });
});

var listener = app.listen(/*process.env.PORT*/ 5000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});

function checkNotifications() {
    //TODO
}

app.get('/s', function (req, res) {
    console.log("trying to send")
    for (var i = 0; i < subscriptions.length; i++) {
        push.send("hi", subscriptions[i]);
    }
})

var subscriptions = [];
app.post('/notifications', function (req, res) {
    subscriptions.push(req.body);
    res.send();
    console.log(subscriptions)
});

app.get('/test', function (req, res) {
    res.send("nice");

});















app.get('/mockup', function (request, response) {
    response.sendFile(__dirname + "/sampleDay_spikes.json");
});

app.get('/mockup2', function (request, response) {
    response.sendFile(__dirname + "/sampleDay_fewSpikes.json");
});