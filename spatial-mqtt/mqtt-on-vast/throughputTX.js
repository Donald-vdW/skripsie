require('./client/common')

// const crypto = require('crypto')
const { Buffer } = require('buffer')
const fs = require('fs')
const { _recordEvent } = require('./client/recordEvents')
const mqtt = require('mqtt')

const client = mqtt.connect(`mqtt://${BROKER}:${PORT}`)

const clientID = client.options.clientId
const _alias = `C1` //DO NOT CHANGE THIS

let _pos =      {x: 80, y: 80}

let _defaultOpts = {
    id :        clientID,
    alias :     _alias,
    pos:        _pos,
    matcher:    client.options.hostname
}

let subscriptions = []
let publications = []
let doTest = false

client.on(`connect`, 
    function(packet) {
        _recordEvent(Client_Event.CLIENT_JOIN, _defaultOpts)
        client.subscribe(`Test`)
        console.log(`Connected to the MQTT broker: ${client.options.hostname}`)
    }
)

client.on(`packetreceive`, function(packet) {
    // console.log(packet)
    switch(packet.cmd){
        case "publish":{
            if(isSpatial(packet.topic)){
                // console.log(`${packet.cmd} recieved\nTopic: ${packet.topic}\nMessage:`, packet.payload.toString())
                let eventPayload = {
                    ..._defaultOpts,
                    packet: packet
                }
                _recordEvent(Client_Event.RECEIVE_PUB,eventPayload)
            }
            break
        }
        case "suback":{
            // console.log(`Subscribe acknowledged!`)
            break
        }
        case "unsuback":{
            console.log(`Unsubscribe acknowledged!`)
            break
        }
        case "connack":{
            // console.log(`Connection acknowledged!`)
            break
        }
        default:{
            // console.log(`Recieved:\n`,packet)
            break
        }
    }
        
})

client.on(`packetsend`, function(packet){
    // // console.log("PACKET SENT:")
    switch(packet.cmd){
        case "subscribe":{
            packet.subscriptions.forEach(sub => {
                let _topic = sub.topic
                if(isSpatial(_topic)){
                    let eventPayload = {
                        ..._defaultOpts,
                        topic: _topic
                    }
                    _recordEvent(Client_Event.SUB_NEW, eventPayload)
                }
            })
            break
        }
        case "publish":{
            // console.log(`Publication: `, packet.payload, `to Topic: `,packet.topic)
            if(isSpatial(packet.topic)){
                let eventPayload = {
                    ..._defaultOpts,
                    payload: packet.payload,
                    topic: packet.topic
                }
                _recordEvent(Client_Event.PUB, eventPayload)
            }
            break
        }
        case "unsubscribe":{
            // // console.log(packet)
            packet.unsubscriptions.forEach(sub => {
                if(isSpatial(sub)){
                    // console.log(`Unsubscribe sent for: `,sub)
                    let eventPayload = {
                        ..._defaultOpts,
                        topic: sub
                    }
                    _recordEvent(Client_Event.SUB_DELETE, eventPayload)
                }
            })
            break
        }
        default: {
            // console.log(packet)
        }
    }
})

client.on(`end`, function(){
    // console.log(`Disconected from Client`)
})

client.on(`reconnect`, function(){
    // console.log(`Reconnecting to the MQTT broker`)
})

client.on(`close`, function(){
    // console.log(`Disconnected from the MQTT broker: ${client.options.hostname}`)
})

client.on(`disconnect`, function(packet){
    // console.log(`Received disconnect packet: `, packet)
})

client.on(`offline`, function(){
    // console.log(`Client is offline`)
})

client.on(`error`, function(err){
    console.error(`An error occurred: `, err)
})


client.on(`message`, 
    async function(topic, message, packet){
        if(message.toString() === `Start Test` && topic === `Test`){
            console.log(`STARTING...`)
            _recordEvent(Client_Event.START_TEST, _defaultOpts)
            doTest = true
            handleCommands()
            // spPublish({x: 100, y: 100, radius: 50, channel: `channel1`},`Random String`,0)
        }

        if(message.toString() === `End Test` && topic === `Test`){
            doTest = false
            client.end()
        
            console.log(`Ending...`) 
            _recordEvent(Client_Event.END_TEST, _defaultOpts)
            _recordEvent(Client_Event.CLIENT_LEAVE, _defaultOpts)
            await delay(1000)
            process.exit(0);
        }
})

function spPublish(publication, msg, count) {
    client.publish(`sp: <${JSON.stringify(publication)}> pubID: <${clientID}-${count}>`, msg)
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSpatial(topic){
    return topic.startsWith('sp:')
}

let intervalId;  // Hold the reference to the interval
function handleCommands() {
    let pubCount = 0;
    
    intervalId = setInterval(() => {
        if (!doTest) {
            clearInterval(intervalId);  // Stop if doTest is false
            return;
        }

        spPublish({x: 100, y: 100, radius: 50, channel: `channel1`}, `Random String ${pubCount}`, pubCount);
        pubCount++;

    }, 1);  // Adjust the interval duration as needed
}