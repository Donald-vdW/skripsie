var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1884')

var publish = {
            x : 10,
            y : 10,
            radius : 5,
            channel : 1
        };

var payload = 'Hello spatial MQTT'
var subscribe = {x: 80, y: 80, radius: 5, channel: 1};

topic = 'sp: <'+JSON.stringify(subscribe)+'>'

console.log('Subscribing to topic: '+topic)
client.subscribe(topic)

client.on('message', function (topic, message) {
console.log(message.toString())
})

setTimeout(function () {
    console.log('Unsubscribing from topic: '+topic)
    client.unsubscribe(topic)
},
10000);