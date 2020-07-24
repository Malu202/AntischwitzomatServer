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
            sensor_id INTEGER PRIMARY KEY NOT NULL,,
        );`);

        db.run(`CREATE TABLE Measurements (
            time DATETIME,
            temperature DECIMAL,
            humidity DECIMAL,
            pressure DECIMAL,
            FOREIGN KEY (sensor_id)
                REFERENCES sensors (sensor_id)
        );`);

        db.run(`CREATE TABLE Rooms (
            room_id INTEGER PRIMARY KEY,
            name VARCHAR(100),
            type VARCHAR(100),
            FOREIGN KEY (sensor_id1)
                REFERENCES sensors (sensor_id),
            FOREIGN KEY (sensor_id2)
                REFERENCES sensors (sensor_id)  
        );`);

    }
});