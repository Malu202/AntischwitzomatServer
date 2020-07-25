// Sensors
[
    { sensorId: "12345" }
]

// Measurements
[
    { sensorId: "12345", timestamp: "2020-07-18T01:06:24.486Z", temperature: 25, humidity: 51, pressure: 1004 }
]

// Rooms
[
    { roomId: "asfd", name: "Wohnung", type: "average", sensorId1: "12345", sensorId2: "67890" },
    { roomId: "jklo", name: "Balkon", type: "single", sensorId1: "99999", sensorId2: null }
]

// Notifications
[
    { userid: "9876", type: "greaterThan", value: "temperature", roomId1: "asfd", roomId2: "jklo", amount: 2, notificationKeys: "..." },
    { userid: "9876", type: "falling", value: "pressure", roomId1: "jklo", roomId2: null, amount: 0.5, notificationKeys: "..." }
]
// Dh notification wenn Balkontemperatur um 2 Grad höher ist als Wohnungsdurchschnittstemperatur oder
// der Luftdruck um mehr als 0.5 bar / minute sinkt


// Notification types sind natürlich beliebig erweiterbar und externe Sensoren (APIs, etc)
// gehen einfach als request bei measurements rein, als "hardware" sensor