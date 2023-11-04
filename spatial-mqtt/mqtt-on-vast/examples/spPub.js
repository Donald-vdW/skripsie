require(`../client/common`)

const mqtt = require(`mqtt`)
const client = mqtt.connect(`mqtt://${HOST_ADDRESS}:${PORT}`)
const _alias = `C2`
const id = client.options.clientId

let pubCount = 0
// Subscribe
let subscribe = {x: 80, y: 80, radius: 5, channel: `channel1`}
// let subTopic = `sp: <${JSON.stringify(subscribe)}>` 
// console.log(`Subscribing to topic: `+subTopic)
// client.subscribe(subTopic)

let pubTopic = `sp: <${JSON.stringify(subscribe)}> pubID: <${id}-${++pubCount}>`
let payload = `Hello spatial MQTT`
client.publish(pubTopic, payload)

client.on(`message`, function (topic, message) {
  console.log(message.toString())
})

client.on(`packetreceive`, function(packet){
  console.log(packet)
})

setTimeout(function () {
	// console.log(`Unsubscribing from topic: `+subTopic)
	// client.unsubscribe(subTopic)
    client.end()
  },
10000)
