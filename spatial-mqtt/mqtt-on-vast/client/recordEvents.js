require('./common')
// returns number of milliseconds since 1970
let getTimestamp = function () {
    let now = new Date();
    return now.getTime();
}

let allEvents = []
let startTime = 0

exports._recordEvent = function(event, msg){
    // console.log(Client_Event_Str[event])
    switch (event){

        case Client_Event.CLIENT_JOIN :{
          let data = {
            time : performance.now(),
            event : event,
            id : msg.id,
            alias : msg.alias,
            pos: msg.pos,
            matcher : msg.matcher
          }
          allEvents.push(data);
          break
        }

        case Client_Event.SUB_NEW :{
            let subscription = splitSubTopic(msg.topic)
            let _sub = {
                hostID: msg.matcher,
                hostPos: {
                    x: -Infinity,
                    y: -Infinity
                },
                clientID: msg.id,
                subID: subscription.subID,
                channel: subscription.channel,
                aoi: {
                    center: {
                        x: subscription.x,
                        y: subscription.y
                    },
                    radius: subscription.radius
                },
                recipients :-Infinity,
                heartbeat : -Infinity
            }
            let data = {
                time : performance.now(),
                event : event,
                id : msg.id,
                alias : msg.alias,
                matcher : msg.matcher,
                sub : _sub
            }
            allEvents.push(data);
            break;
        }

        case Client_Event.PUB :{
            // console.log(performance.now())
            // let aoi = new VAST.area(new VAST.pos(msg.pub.x, msg.pub.y), msg.pub.radius);
            let topic = splitPubTopic(msg.topic)
            let pub = {
                pubID: topic.pubID,
                aoi: {
                    center: {
                        x: topic.x,
                        y: topic.y
                    },
                    radius: topic.radius
                },
                channel: topic.channel,
                payload: msg.payload
            }

            let data = {
                time : performance.now(),
                event : event,
                id : msg.id,
                alias : msg.alias,
                matcher: msg.matcher,
                pub : pub
            }
            allEvents.push(data);
            break;
        }

        case Client_Event.SUB_DELETE :{
            let subscription = splitSubTopic(msg.topic)
            let data = {
                time : performance.now(),
                event : event,
                id : msg.id,
                alias : msg.alias,
                matcher: msg.matcher,
                subID : subscription.subID
            }
            allEvents.push(data)
            break
        }

        case Client_Event.RECEIVE_PUB :{
            let topic = splitPubNSubTopic(msg.packet.topic)
            let _pub = {
                matcherID: msg.matcher,
                clientID:  msg.id,
                pubID: topic.pubID,
                subID: topic.subID,
                aoi: {
                    center: {
                        x: topic.x,
                        y: topic.y
                    },
                    radius: topic.radius
                },
                payload: msg.packet.payload.toString(),
                channel: topic.channel,
                recipients: -Infinity,
                chain: -Infinity
            }

            let data = {
                time : performance.now(),
                event : event,
                id : msg.id,
                alias : msg.alias,
                matcher: msg.matcher,
                pub: _pub,
            }
            allEvents.push(data)
            break
        }

        case Client_Event.CLIENT_LEAVE :{
            let data = {
                time : performance.now(),
                event : event,
                id : msg.id,
                alias : msg.alias,
                matcher: msg.matcher,
            }
            allEvents.push(data);
            let promises = allEvents.map(event => {
                return new Promise((resolve, reject) => {
                    event['time'] -= startTime;
                    events.printObject(event, (err) => {   // Assuming printObject uses a callback
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            });
            
            Promise.all(promises)
                .then(() => {
                    process.exit(0);
                })
                .catch(err => {
                    console.error("An error occurred:", err);
                });
        }
        
        case Client_Event.START_TEST:{
            startTime = performance.now()
            // Also cange the connect time:
            let data = {
                time: startTime,
                event : event,
                id : msg.id,
                alias : msg.alias,
                matcher: msg.matcher,
            }
            allEvents.push(data)
        }

        case Client_Event.END_TEST:{
            // Also cange the connect time:
            let data = {
                time: performance.now(),
                event : event,
                id : msg.id,
                alias : msg.alias,
                matcher: msg.matcher,
            }
            allEvents.push(data)
        }
    //     case Client_Event.CLIENT_CONNECT :{
    //       let data = {
    //         time : performance.now(),
    //         event : event,
    //         id : _id,
    //         alias : _alias,
    //         pos: msg.pos,
    //         matcher : _matcherID
    //       }
    //       events.printObject(data);
    //       break
    //     }
  
    //     case Client_Event.CLIENT_MOVE :{
    //       let data = {
    //         time : performance.now(),
    //         event : event,
    //         id : _id,
    //         alias : _alias,
    //         pos: _pos,
    //         oldpos: msg.oldpos,
    //         matcher : _matcherID
    //       }
    //       events.printObject(data);
    //       break;
    //     }
    }

}

function encode(data) {
    const { x, y, radius, channel } = data
    
    // Convert x, y, and radius into Buffers (4 bytes each for up to 32-bit numbers)
    const xBuffer = Buffer.alloc(4)
    xBuffer.writeUInt32BE(x)
    
    const yBuffer = Buffer.alloc(4)
    yBuffer.writeUInt32BE(y)
    
    const radiusBuffer = Buffer.alloc(4)
    radiusBuffer.writeUInt32BE(radius)
    
    // Convert channel into a Buffer
    const channelBuffer = Buffer.from(channel)
    
    // Concatenate all Buffers
    const totalBuffer = Buffer.concat([xBuffer, yBuffer, radiusBuffer, channelBuffer])
    
    // Convert the Buffer into a base64 encoded string
    return totalBuffer.toString('base64')
}

function decode(encoded) {
    const buffer = Buffer.from(encoded, 'base64');
    
    const x = buffer.readUInt32BE(0);
    const y = buffer.readUInt32BE(4);
    const radius = buffer.readUInt32BE(8);
    const channel = buffer.slice(12).toString();
    
    return { x, y, radius, channel };
}

function splitSubTopic(topic) {
    const match = topic.match(/sp: <(.*?)> subID: <(.*?)>$/);
    const spatialData = match[1];
    const subscriptionID = match[2];
    return {
        ...JSON.parse(spatialData),
        subID: subscriptionID
    }
}

function splitPubTopic(topic) {
    const match = topic.match(/sp: <(.*?)> pubID: <(.*?)>$/);
    const spatialData = match[1];
    const publicationID = match[2];
    return {
        ...JSON.parse(spatialData),
        pubID: publicationID
    }
}

function splitPubNSubTopic(topic) {
    const match = topic.match(/sp: <(.*?)> pubID: <(.*?)> subID: <(.*?)>$/);
    const spatialData = match[1];
    const publicationID = match[2];
    const subscriptionID = match[3];
    return {
        ...JSON.parse(spatialData),
        pubID: publicationID,
        subID: subscriptionID
    }
}
