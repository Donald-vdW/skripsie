require('../client/common')

// const crypto = require('crypto')
const { Buffer } = require('buffer')
const fs = require('fs')
const { _recordEvent } = require('../client/recordEvents')
const mqtt = require('mqtt')

const client = mqtt.connect(`mqtt://${BROKER}:${PORT}`)

const clientID = client.options.clientId
const _alias = `C1` //DO NOT CHANGE THIS

let _pos =      {x: 80, y: 80}

let _defaultOpts = {
    id :        clientID,
    alias :     _alias,
    // pos:        _pos,
    matcher:    client.options.hostname
}

let doTest = false

let pubCount = 0
let subCount = 0

let subscriptions = []

client.on(`packetreceive`, function(packet) {
    switch(packet.cmd){
        case "publish":{
            if(isSpatial(packet.topic)){
                let eventPayload = {
                    ..._defaultOpts,
                    packet: packet
                }
                _recordEvent(Client_Event.RECEIVE_PUB,eventPayload)
            } else {
                if (packet.topic === `Test`){
                    break
                }
                let eventPayload = {
                    ..._defaultOpts,
                    non_spatial_event: Client_Event.RECEIVE_PUB,
                    packet: packet
                }
                _recordEvent(Client_Event.NON_SPATIAL_EVENT,eventPayload)
            }
            break
        }
        case "unsuback":{
            console.log(`Unsubscribe acknowledged!`)
            break
        }
        default:{
            console.log(`Write Record event for RECEIVING: `,packet.cmd)
            break
        }
    }
        
})

client.on(`packetsend`, function(packet){
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
                } else{
                    // console.log(`Non spatial SUB`,packet.subscriptions)
                    let eventPayload = {
                        ..._defaultOpts,
                        non_spatial_event: Client_Event.SUB_NEW,
                        topic: _topic
                    }
                    _recordEvent(Client_Event.NON_SPATIAL_EVENT,eventPayload)
                }
            })
            break
        }
        case "publish":{
            if(isSpatial(packet.topic)){
                let eventPayload = {
                    ..._defaultOpts,
                    payload: packet.payload,
                    topic: packet.topic
                }
                _recordEvent(Client_Event.PUB, eventPayload)
            } else{
                // console.log(`Non spatial PUB `,packet.topic)
                let eventPayload = {
                    ..._defaultOpts,
                    non_spatial_event: Client_Event.PUB,
                    payload: packet.payload,
                    topic: packet.topic
                }
                _recordEvent(Client_Event.NON_SPATIAL_EVENT,eventPayload)
            }
            break
        }
        case "unsubscribe":{
            packet.unsubscriptions.forEach(sub => {
                if(isSpatial(sub)){
                    let eventPayload = {
                        ..._defaultOpts,
                        topic: sub
                    }
                    _recordEvent(Client_Event.SUB_DELETE, eventPayload)
                } else{
                    let eventPayload = {
                        ..._defaultOpts,
                        non_spatial_event: Client_Event.SUB_DELETE,
                        topic: sub
                    }
                    _recordEvent(Client_Event.NON_SPATIAL_EVENT,eventPayload)
                }
            })
            break
        }
        case "disconnect":{
            _recordEvent(Client_Event.END_TEST, _defaultOpts)
            _recordEvent(Client_Event.CLIENT_LEAVE, _defaultOpts)
            break
        }
        default: {
            console.log(`Write Record event for SENDING: `,packet.cmd)
        }
    }
})

client.on(`error`, function(err){
    console.error(`An error occurred: `, err) 
    //TODO: Write a record event for this
})

client.on(`message`, 
    async function(topic, message, packet){
        msg = message.toString()
        switch (true) {
            case msg === `Start Test` && topic === `Test`:
                _recordEvent(Client_Event.START_TEST, _defaultOpts)
                doTest = true
                // basicTest()
                // randomPubTest()
                nonSpatialTest()
                break;
            
            case msg === `End Test` && topic === `Test`:
                doTest = false
                console.log(`Test Ended`)
                await handleNonSpatialUnsubscriptions(subscriptions)
                    // .then(async () => {
                    //     client.publish(subscriptions[0], `pubID: <${clientID}-pub${pubCount++}> msg: <This is a random message>`)
                    //     await delay(3000)
                    // })
                    .then(() => {
                        client.end()
                    })
                break;
            /* 
            Add more cases here for specific messages from specific topics:
            case msg === String_to_test_for && topic === topic_to_test_for:
                // Do something
                break;
            */
            default:
                break;
        }

})

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

{
/** 
 * The functions bellow handle all Spatial MQTT operations 
 **/

function isSpatial(topic){
    return topic.startsWith('sp:')
}

function spSubscribe(subscription) {
    // If no subID is provided, subscribe with a new subID
    const subID = subscription.subID || `${clientID}-sub${subCount++}`;
    const topic = subscription.topic;
    return new Promise((resolve, reject) => {
        client.subscribe(`sp: <${JSON.stringify(topic)}> subID: <${subID}>`, (error) => {
            if (error) {
                reject(`Failed to subscribe to ${topic}`);
            } else {
                resolve(`Subscribed to ${topic}`);
            }
        });
    });
}

function spPublish(publication, message) {
    const msg = message || `Random publicatoin: ${publication.pubID}`;
    const topic = publication.topic;
    const pubID = publication.pubID || `${clientID}-pub${pubCount++}`;
    return new Promise((resolve, reject) => {
        client.publish(`sp: <${JSON.stringify(topic)}> pubID: <${pubID}>`, msg, (error) => {
            if (error) {
                reject(`Failed to publish message to ${topic}`);
            } else {
                resolve(`Message published to ${topic}`);
            }
        });
    });
}

function spUnsub(subscription) {
    // If no subID is provided, unsubscribe from the latest subscription
    const subID = subscription.subID || `${clientID}-sub${subCount++}`;
    const topic = subscription.topic;
    return new Promise((resolve, reject) => {
        client.unsubscribe(`sp: <${JSON.stringify(topic)}> subID: <${subID || `${clientID}-sub${subCount-1}`}>`, (error) => {
          if (error) {
            reject(`Failed to unsubscribe from ${topic}`);
          } else {
            resolve(`Unsubscribed from ${topic}`);
          }
        });
      });
}

// Function to handle all Subscriptions
function handleSpatialSubscriptions(subscriptions) {
    const subscriptionPromises = subscriptions.map(spSubscribe);
    return Promise.all(subscriptionPromises);
}

// Function to handle all Publications
function handleSpatialPublications(publications) {
    // This example publishes the same message to all topics
    const publicationPromises = publications.map(publication => spPublish(publication));
    return Promise.all(publicationPromises);
}

// Function to handle all Unsubscriptions
function handleSpatialUnsubscriptions(subscriptions) {
    const unsubscriptionPromises = subscriptions.map(spUnsub);
    return Promise.all(unsubscriptionPromises);
}

// Function to generate random Publications
function generateRandomPublications(numOfEvents) {
    const publications = [];
    for (let i = 0; i < numOfEvents; i++) {
        // Randomly choose an x and y from [0,255)
        x = Math.random() * 255
        y = Math.random() * 255
        // Randomly choose a radius from [0,50)
        radius = Math.random() * 50
        // Randomly choose a channel from {channel1, channel2, channel3}
        channel = `channel${Math.floor(Math.random() * 3) + 1}`
        
        publications.push(generatePublication(x,y,radius,channel))    
    }
    return publications;
}

// Function to generate random Subscriptions
function generateRandomSubscriptions(numOfEvents) {
    const subscriptions = [];
    for (let i = 0; i < numOfEvents; i++) {
        // Randomly choose an x and y from [0,255)
        x = Math.random() * 255
        y = Math.random() * 255
        // Randomly choose a radius from [0,50)
        // radius = Math.random() * 50
        radius = 25
        // Randomly choose a channel from {channel1, channel2, channel3}
        channel = `channel${Math.floor(Math.random() * 3) + 1}`

        subscriptions.push(generateSubscription(x,y,radius,channel))
    }
    return subscriptions;
}

function generateSubscription(x,y,radius,channel) {
    const sub = {
        topic : {
            x: x,
            y: y,
            radius: radius,
            channel: channel
        },
        subID: `${clientID}-sub${subCount++}`
    }
    return sub;
}

function generatePublication(x,y,radius,channel) {
    const pub = {
        topic : {
            x: x,
            y: y,
            radius: radius,
            channel: channel
        },
        pubID: `${clientID}-pub${pubCount++}`
    }
    return pub;
}
}
client.on('connect', () => {
    // Log that the client has joined
    _recordEvent(Client_Event.CLIENT_JOIN, _defaultOpts)

    // Log successful connection to the broker
    console.log(`Connected to the MQTT broker: ${client.options.hostname}`)

    // For testing, subscribe to the Test channel
    client.subscribe(`Test`, (error) => {
        if (error) {
            console.error(`Failed to subscribe to Test channel`);
        } else {
            console.log(`Subscribed to Test channel`);
        }
    })
});

/**
 *  This is a basic test that subscribes to 10 random AoIs
 *  and then also publishes to those AoIs, before unsubscribing 
 *  from them
 */
function basicTest(){
    // Generate 10 random subscriptions
    const subscriptions = generateRandomSubscriptions(10); 
    const publications = subscriptions.map(function(sub) {
        return generatePublication(
            sub.topic.x,
            sub.topic.y, 
            sub.topic.radius, 
            sub.topic.channel
        )
    })

    // Generate 10 random subs and pub to them befor unsubbing
    handleSpatialSubscriptions(subscriptions)
        .then((subscriptionResults) => {
        console.log(subscriptionResults);
        return handleSpatialPublications(publications); // Proceed to publish messages
        })
        .then((publicationResults) => {
        console.log(publicationResults);
        return handleSpatialUnsubscriptions(subscriptions); // Proceed to unsubscribe
        })
        .then((unsubscriptionResults) => {
        console.log(unsubscriptionResults);
        // Disconnect from the broker
        })
        .catch((error) => {
        console.error(error);
        client.end(); // Disconnect from the broker in case of error
        });
}

/**
 * This is a test that subscribes to one random AoI
 * and then publishes to random AoIs every 100ms
 * until the test is ended
 */
function randomPubTest(){
    let subscription = generateRandomSubscriptions(1)[0]
    subscriptions.push(subscription)
    let intervalId;
    spSubscribe(subscription)
        .then((result) => {
            console.log(result)
            intervalId = setInterval(() => {
                if (!doTest) {
                    clearInterval(intervalId);  // Stop if doTest is false
                    // spUnsub(subscriptions[0].subscription, subscriptions[0].subID)
                    return doTest;
                }
        
                let pub = generateRandomPublications(1)[0]
                // console.log(pub)
                spPublish(pub,"RandomString")
        
            }, 40);  // Adjust the interval duration as needed
        })
}

/************************************************************************
 * 
 *  The functions bellow Handle NON-SPATIAL MQTT operations
 * 
 ***********************************************************************/

function handleNonSpatialSubscriptions(subscriptions) {
    const subscriptionPromises = subscriptions.map(
        subscription => client.subscribe(
            subscription, (error) => {
                if (error) {
                    console.error(`Failed to subscribe to ${subscription}`);
                } else {
                    // console.log(`Subscribed to ${subscription}`);
                }
            }
        )
    );
    return Promise.all(subscriptionPromises);
}

function getRandomTopic(numOfEvents) {
    // list of 25 random topics
    let randomTopics = [
        'Topic1',
        'Topic2',
        'Topic3',
        'Topic4',
        'Topic5',
        'Topic6',
        'Topic7',
        'Topic8',
        'Topic9',
        'Topic10',
        'Topic11',
        'Topic12',
        'Topic13',
        'Topic14',
        'Topic15',
        'Topic16',
        'Topic17',
        'Topic18',
        'Topic19',
        'Topic20',
        'Topic21',
        'Topic22',
        'Topic23',
        'Topic24',
        'Topic25'
    ]
    const topics = [];
    for (let i = 0; i < numOfEvents; i++) {
        // Randomly choose a subscription from the list of random topics
        let subscription = randomTopics[Math.floor(Math.random() * randomTopics.length)]
        topics.push(subscription)
    }
    return topics;
}

// Function to handle all Unsubscriptions
function handleNonSpatialUnsubscriptions(subscriptions) {
    const unsubscriptionPromises = subscriptions.map(sub => client.unsubscribe(sub));
    return Promise.all(unsubscriptionPromises);
}

// Function to handle logic for non spatial test
function nonSpatialTest(){
    // Randomly choose a subscription from the list of random topics
    let subscription = getRandomTopic(1)[0]
    subscriptions.push(subscription)

    let intervalId;
    handleNonSpatialSubscriptions(subscriptions)
        .then(handleNonSpatialSubscriptions(subscriptions)
            .then(
                () => {
                    intervalId = setInterval(() => {
                        if (!doTest) {
                            clearInterval(intervalId); 
                            return doTest;
                        }
                
                        let pub_topic = getRandomTopic(1)[0]
                        client.publish(pub_topic, `pubID: <${clientID}-pub${pubCount++}> msg: <This is a random message>`)
                    }, 40);  // Adjust the interval duration as needed
                }
                // client.publish(subscription, `pubID: <${clientID}-pub${pubCount++}> msg: <This is a random message>`)
            ))
}