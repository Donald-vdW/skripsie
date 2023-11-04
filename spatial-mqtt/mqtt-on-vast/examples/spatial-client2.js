require('../client/common')

// const crypto = require('crypto')
const { Buffer } = require('buffer')
const { _recordEvent } = require('../client/recordEvents')
const mqtt = require('mqtt')

const client = mqtt.connect(`mqtt://${HOST_ADDRESS}:${PORT}`)

const clientID =       client.options.clientId
const _alias =    'C2'

let _pos =      {x: 80, y: 80}

let _defaultOpts = {
    id :        clientID,
    alias :     _alias,
    pos:        _pos,
    matcher:    client.options.hostname
}

client.on(`connect`, function(packet) {
    _recordEvent(Client_Event.CLIENT_JOIN, _defaultOpts)
    // console.log(`Connected to the MQTT broker: ${client.options.hostname}`)
    client.subscribe(`Test`)
})

client.on(`packetreceive`, function(packet) {
    console.log(packet)
    switch(packet.cmd){
        case "publish":{
            if(isSpatial(packet.topic)){
                console.log(`${packet.cmd} recieved\nTopic: ${packet.topic}\nMessage:`, packet.payload.toString())
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
            // console.log(`Unsubscribe acknowledged!`)
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
            await delay(2)
            handleCommands()
        }

        if(message.toString() === `End Test` && topic === `Test`){
            console.log(`Ending...`)
            _recordEvent(Client_Event.CLIENT_LEAVE, _defaultOpts)
            client.end()
        }
})

// setTimeout(
//     function () {
//         // console.log('Ending connection...')
//         _recordEvent(Client_Event.CLIENT_LEAVE, _defaultOpts)
//         client.end()
//     }, 
//     2000
// )

function spSubscribe(subscription) {
    client.subscribe(`sp: <${JSON.stringify(subscription)}>`)
}

function spPublish(publication, msg, count) {
    client.publish(`sp: <${JSON.stringify(publication)}> pubID: <${clientID}-${count}>`, msg)
}

function spUnsub(subscription) {
    client.unsubscribe(`sp: <${JSON.stringify(subscription)}>`)
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSpatial(topic){
    return topic.startsWith('sp:')
}

async function handleCommands(){
    let pubCount = 0
    let pubMsg = 'HELLO FROM C2'
    let channel = 1

    let pub = {
        x:          80,
        y:          80,
        radius:     30,
        channel:    `channel${channel}`
    }
    
    // await delay(2)
    spPublish(pub, pubMsg, ++pubCount)
}







