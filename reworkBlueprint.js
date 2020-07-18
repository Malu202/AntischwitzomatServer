// Measurements
[
    { hardwareSensorId: "12345", temperature: 25, pressure: 1004, humidity: 51, timestamp: "2020-07-18T01:06:24.486Z" }}
]

// Virtual Sensors
[
    { virtualSensorId: "asfd", name: "Wohnung", type: "average", hardwareSensorId1: "12345", hardwareSensorId2: "67890" },
    { virtualSensorId: "jklo", name: "Balkon", type: "single", hardwareSensorId1: "99999", hardwareSensorId2: null }
]

// Notifications
[
    { userid: "9876", type: "greaterThan", value: "temperature", virtualSensorId1: "asfd", virtualSensorId2: "jklo", offset: 2, notificationKeys: "..." },
    { userid: "9876", type: "falling", value: "pressure", virtualSensorId1: "jklo", virtualSensorId2: null, amount: 0.5, notificationKeys: "..." }
]
// Dh notification wenn Balkontemperatur um 2 Grad höher ist als Wohnungsdurchschnittstemperatur oder
// der Luftdruck um mehr als 0.5 bar / minute sinkt


// Notification types sind natürlich beliebig erweiterbar und externe Sensoren (APIs, etc)
// gehen einfach als request bei measurements rein, als "hardware" sensor