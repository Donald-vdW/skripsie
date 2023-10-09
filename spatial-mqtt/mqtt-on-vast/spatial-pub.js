var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://localhost:1884')

var publish = {
            x : 27,
            y : 27,
            radius : 5,
            channel : 1
        };

var payload = 'Hello spatial MQTT <80,80,30>'
var subscribe = {x: 80, y: 80, radius: 30, channel: 1};

topic = 'sp: <'+JSON.stringify(subscribe)+'>'

msg = 'sp: <'+JSON.stringify(publish)+'>'
console.log('Publishing message to topic: '+topic)
client.publish(topic, payload)

client.on('message', function (topic, message) {
console.log(message.toString())
})

setTimeout(function () {
    console.log('Ending connecting')
    client.end()
}, 
500);