const fs = require('fs');
const readline = require('readline');
require('../client/common');  // Importing a common module from client folder

/**
 * Filenames and initializations.
 */
const filename = process.argv[2] || "./simulator/example_script.txt";
let events = [];
const clients = {};
const subscriptions = {};
const publications = {};
let receivedEvents = [];
let totalSubscriptions = 0;
let totalUnsubscriptions = 0;
let totalSubscriptionUpdates = 0;

/**
 * Setting up the file stream and readline interface.
 */
const fileStream = fs.createReadStream(filename);
const rl = readline.createInterface({
	input: fileStream,
	crlfDelay: Infinity   // To handle CR/LF and LF line endings
});

/**
 * Reading events from the file.
 */
rl.on('line', (line) => {
	events.push(JSON.parse(line));
});

rl.on('close', () => {
  // Sort events by time and then by event type
	events = events.sort((a, b) => a.time - b.time || a.event - b.event);

	// Prepare the events for analysis
  for (let event of events) {
    prepareClientEvent(event);
  }

  // Error counters and detailed messages
  // Define variables to track different error types
	let type1Errors = 0;  // missed deliveries
  let type2Errors = 0;  // duplicate deliveries
  let type3Errors = 0;  // unwanted deliveries

  const type1ErrorDetails = [];
  const type2ErrorDetails = [];
  const type3ErrorDetails = [];

  for (const pubID in publications) {
      const pub = publications[pubID];

      const uniqSubscribers = new Set(pub.subscribers);
      const uniqRecipients = new Set(pub.recipients);

      // Find those who were supposed to receive but did not
      const missedRecipients = [...uniqSubscribers].filter(subID => !uniqRecipients.has(subID));
      missedRecipients.forEach(missed => {
          const relatedSubscription = subscriptions[findSubscriptionByClient(missed)];
          const errMsg = `Publication ${pubID} was not sent to client ${missed}`;
          type1ErrorDetails.push(errMsg);
      });

      // Find those who received but were not supposed to
      const extraRecipients = [...uniqRecipients].filter(recipientID => !uniqSubscribers.has(recipientID));
      extraRecipients.forEach(extra => {
          const relatedSubscription = subscriptions[findSubscriptionByClient(extra)];
          const errMsg = `Client ${extra} received publication ${pubID} linked to subscription ${relatedSubscription ? relatedSubscription.subID : 'unknown'} but subscription ${relatedSubscription ? relatedSubscription.subID : 'unknown'} is not one of its subscriptions`;
          type3ErrorDetails.push(errMsg);
      });
      
  }

  // Helper function to get the subscription ID by client ID
  function findSubscriptionByClient(clientID) {
    for (const subID in subscriptions) {
      const sub = subscriptions[subID];
      if (sub.clientID === clientID) {
        return subID;
      }
    }
    return null;  // Or some default value to indicate no match was found
  }

  const seen = new Set();
  const duplicates = [];
  
  receivedEvents.forEach(event => {
      const compositeKey = `${event.pub.pubID}-${event.pub.subID}`;
      if (seen.has(compositeKey)) {
          duplicates.push(event);
          const errMsg = `Client ${event.id} received duplicates of publication ${event.pub.pubID} linked to subscription ${event.pub.subID}`;
          type2ErrorDetails.push(errMsg);
      } else {
          seen.add(compositeKey);
      }
  });
  

  let correctDeliveries = events.filter(e => e.event === Client_Event.RECEIVE_PUB).length - (type1Errors + type2Errors + type3Errors);
  let requiredDeliveries = correctDeliveries+type1ErrorDetails.length
  // Print out a summary of the results
	console.log(`Number of events: ${events.length}`);
	console.log(`Number of clients: ${Object.keys(clients).length}`);
  console.log(`Number of subscriptions made (including updates): ${totalSubscriptions}`);
  console.log(`Number of subscription updates: ${totalSubscriptionUpdates}`);
  console.log(`Number of unsubscriptions: ${totalUnsubscriptions}`);
	console.log(`Number of publications sent: ${Object.keys(publications).length}`);
	console.log(`Number of required publication deliveries: ${requiredDeliveries}`);
	console.log(`Number of publications correctly delivered: ${correctDeliveries} (${(correctDeliveries/requiredDeliveries).toFixed(4)})`);
	console.log(`Number of type 1 errors (missed deliveries): ${type1ErrorDetails.length} (${(type1ErrorDetails.length/requiredDeliveries).toFixed(4)})`);
  if(type1ErrorDetails.length) console.log(`Type 1 Errors Details: \n${type1ErrorDetails.join('\n')}`)
  console.log(`Number of type 2 errors (duplicate deliveries): ${type2ErrorDetails.length} (${(type2ErrorDetails.length/requiredDeliveries).toFixed(4)})`);
  if(type2ErrorDetails.length) console.log(`Type 2 Errors Details: \n${type2ErrorDetails.join('\n')}`);
  console.log(`Number of type 3 errors (unwanted deliveries): ${type3ErrorDetails.length} (${(type3ErrorDetails.length/requiredDeliveries).toFixed(4)})`);
  if(type3ErrorDetails.length) console.log(`Type 3 Errors Details: \n${type3ErrorDetails.join('\n')}`);
});

/**
 * Processes individual client event data and makes necessary updates.
 * @param {Object} data - The event data object.
 */
var prepareClientEvent = function(data) {
  // Switch case to handle different types of client events
  switch (data.event) {
    case Client_Event.CLIENT_JOIN: {
      if (Object.keys(clients).includes(data.id)) {
        var client = clients[data.id];
        client.time.push(data.time);
        client.pos = data.pos;
        client.matcher = data.matcher;
      } else {
        var client = {
          id : data.id,
          alias : data.alias,
          pos: data.pos,
          matcher: data.matcher,
          time: [data.time],
          leavetime: []
        }
        clients[client.id] = client;
      }
      break;
    }


    case Client_Event.CLIENT_MOVE : {
      var client = clients[data.id];
      client.pos = data.pos;
      break;
    }

    case Client_Event.CLIENT_LEAVE: {
      if (Object.keys(clients).includes(data.id)) {
        var client = clients[data.id];
        client.leavetime.push(data.time);
      }
      break;
    }

    // TODO: fix for update / delete differences
    case Client_Event.SUB_NEW : {
      totalSubscriptions++;
      var sub = data.sub;
      subscriptions[sub.subID] = data.sub;
      break;
    }
    case Client_Event.SUB_UPDATE : {
      totalSubscriptionUpdates++;
      var sub = data.sub;
      subscriptions[sub.subID] = sub;
      break;
    }
    case Client_Event.SUB_DELETE: {
      totalUnsubscriptions++;
      delete subscriptions[data.subID];
      break;
    }
    

    case Client_Event.PUB : {
      publications[data.pub.pubID] = ({time: data.time, pub: data.pub});
      subscribers = [];
      recipients = [];
      for (var subID in subscriptions) {
        sub = subscriptions[subID]
        if (compareAoI(data.pub.aoi, sub.aoi) && (data.pub.channel == sub.channel)) {
          subscribers.push(sub.clientID);
        }
      }
      publications[data.pub.pubID].subscribers = subscribers;
      publications[data.pub.pubID].recipients = recipients;
      break;
    }

    case Client_Event.RECEIVE_PUB : {
        receivedEvents.push(data);  // <-- Add this line
        if (Object.keys(publications).includes(data.pub.pubID)) {
            pub = publications[data.pub.pubID];
            pub.recipients.push(data.id);
        }
        break;
    }

  }
}

/**
 * Compares Areas of Interest (AoI) of a publication and a subscription.
 * @param {Object} pub_aoi - AoI of the publication.
 * @param {Object} sub_aoi - AoI of the subscription.
 * @returns {boolean} - True if the AoIs overlap, false otherwise.
 */
var compareAoI = function(pub_aoi, sub_aoi) {
  // Calculate distance between the centers of the two AoIs
  var distance = Math.sqrt((pub_aoi.center.x - sub_aoi.center.x)**2 + (pub_aoi.center.y - sub_aoi.center.y)**2);

  // Return true if the distance is less than the sum of their radii (meaning they overlap)
  return distance < (pub_aoi.radius + sub_aoi.radius);
}
