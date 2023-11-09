require('./client/common')

// const crypto = require('crypto')
const { Buffer } = require('buffer')
const fs = require('fs')
const { _recordEvent } = require('./client/recordEvents')
const mqtt = require('mqtt')

const client = mqtt.connect(`mqtt://${BROKER}:${PORT}`)

const clientID = client.options.clientId
const _alias = `C90` //DO NOT CHANGE THIS

let _pos =      {x: 80, y: 80}

let _defaultOpts = {
    id :        clientID,
    alias :     _alias,
    pos:        _pos,
    matcher:    client.options.hostname
}

let subscriptions = []
let publications = []

let pubCount = 0
let subCount = 0

client.on(`connect`, 
    function(packet) {
        _recordEvent(Client_Event.CLIENT_JOIN, _defaultOpts)
        client.subscribe(`Test`)
        console.log(`Connected to the MQTT broker: ${client.options.hostname}`)
        generateRandom(global.SUBSCRIBE,1)
        generateRandom(global.PUBLISH,5-subscriptions.length)
        console.log(subscriptions)
        subscriptions.forEach(sub => {
            spSubscribe(sub.subscription, sub.subID)
        })
    }
)

client.on(`packetreceive`, function(packet) {
    // console.log(packet)
    switch(packet.cmd){
        case "publish":{
            if(isSpatial(packet.topic)){
                console.log(packet)
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
            handleCommands()
        }

        if(message.toString() === `End Test` && topic === `Test`){
            console.log(`Ending...`)
            _recordEvent(Client_Event.END_TEST, _defaultOpts)
            endClient()
            await delay(5000)
            process.exit(0)
        }
})

function spSubscribe(subscription, subID) {
    subID = subID || `${clientID}-sub${++subCount}` // If no subID is provided, subscribe with a new subID
    client.subscribe(`sp: <${JSON.stringify(subscription)}> subID: <${subID}>`)
}

function spPublish(publication, pubID, msg) {
    client.publish(`sp: <${JSON.stringify(publication)}> pubID: <${pubID}>`, msg)
}

function spUnsub(subscription, subID) {
    subID = subID || `${clientID}-sub${subCount}` // If no subID is provided, unsubscribe from the latest subscription
    client.unsubscribe(`sp: <${JSON.stringify(subscription)}> subID: <${subID}>`)
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSpatial(topic){
    return topic.startsWith('sp:')
}

function handleCommands(){
    subscriptions.forEach((sub) => {
        let pub = {
            publication : sub.subscription,
            pubID: `${clientID}-pub${++pubCount}`
        }
        publications.push(pub)
    })

    publications.forEach((pub) => {
        spPublish(pub.publication, pub.pubID, `Random String ${pub.pubID}`)
    })

    
}

function generateRandom(event, numOfEvents) {
    switch (event) {
        case global.SUBSCRIBE:
            for (let i = 0; i < numOfEvents; i++) {
                let sub = {
                    subscription : {
                        x: Math.random() * 255,
                        y: Math.random() * 255,
                        radius: Math.random() * 50,
                        channel: `channel${Math.floor(Math.random() * 3) + 1}`
                    },
                    subID: `${clientID}-sub${++subCount}`
                }
                subscriptions.push(sub)
            }
            break
        case global.PUBLISH:
            for (let i = 0; i < numOfEvents; i++) {
                let pub = {
                    publication:{
                        x: Math.random() * 255,
                        y: Math.random() * 255,
                        radius: Math.random() * 50,
                        channel: `channel${Math.floor(Math.random() * 3) + 1}`
                    },
                    pubID: `${clientID}-pub${++pubCount}`
                }
                publications.push(pub)
            }
            break
    }
}

async function endClient() {
    // console.log('Ending connection...')
    subscriptions.forEach(sub => {
        spUnsub(sub.subscription, sub.subID)
    })
    await delay(1000)
    _recordEvent(Client_Event.CLIENT_LEAVE, _defaultOpts)
    client.end()
    subscriptions.forEach(sub =>{
        fs.appendFileSync('./visualise/subscriptions.txt', `${sub.x},${sub.y},${sub.radius},${sub.channel}\n`)
    })
    publications.forEach(pub =>{
        fs.appendFileSync('./visualise/publications.txt', `${pub.x},${pub.y},${pub.radius},${pub.channel}\n`)
    })
}