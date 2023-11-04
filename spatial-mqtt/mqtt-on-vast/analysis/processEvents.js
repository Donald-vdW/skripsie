const fs = require('fs');

// Reading the file
const events = fs.readFileSync('../logs_and_events/Client_events.txt', 'utf-8').split('\n').filter(line => line);

let totalEvents = 0;
let clients = new Set();
let publications = 0;
let subscriptions = {};
let receivedPublications = {};

for (let line of events) {
    let event = JSON.parse(line);
    totalEvents++;

    switch (event.event) {
        case 0: // Client joins the session
            clients.add(event.id);
            break;
        case 6: // New subscription is made
            if (!subscriptions[event.id]) {
                subscriptions[event.id] = [];
            }
            subscriptions[event.id].push(event.sub.subID);
            break;
        case 9: // Publication is made
            publications++;
            break;
        case 10: // Publication is received
            if (!receivedPublications[event.id]) {
                receivedPublications[event.id] = [];
            }
            receivedPublications[event.id].push(event.pub.pubID);
            break;
    }
}

// Calculating statistics
let correctlyDelivered = 0;
let incorrectlyDelivered = 0;
let undelivered = 0;
let superfluous = 0;

for (let client in subscriptions) {
    let subs = subscriptions[client];
    let recPubs = receivedPublications[client] || [];
    
    for (let sub of subs) {
        if (recPubs.includes(sub)) {
            correctlyDelivered++;
        } else {
            undelivered++;
        }
    }

    for (let pub of recPubs) {
        if (!subs.includes(pub)) {
            superfluous++;
        }
    }
}

console.log(`Read ${totalEvents} events`);
console.log(`Number of clients: ${clients.size}`);
console.log(`Number of publications: ${publications}`);
console.log(`[${correctlyDelivered}] publications delivered for [${correctlyDelivered + undelivered}] subscriptions`);
console.log(`[${correctlyDelivered}/${correctlyDelivered + undelivered}] publications were correctly delivered (${((correctlyDelivered / (correctlyDelivered + undelivered)) * 100).toFixed(2)}%)`);
console.log(`[${incorrectlyDelivered}] publications were incorrectly delivered (${((incorrectlyDelivered / (correctlyDelivered + undelivered)) * 100).toFixed(2)}%)`);
console.log(`[${undelivered}] publications undelivered (${((undelivered / (correctlyDelivered + undelivered)) * 100).toFixed(2)}%)`);
console.log(`[${superfluous}] superfluous publications delivered (${((superfluous / (correctlyDelivered + undelivered)) * 100).toFixed(2)}%)`);

// Displaying stats for each client
console.log("-------------------------------------------------------");
for (let client of clients) {
    console.log(`Client: ${client}`);
    console.log(`#subs: ${subscriptions[client] ? subscriptions[client].length : 0}`);
    console.log(`#pubs: ${receivedPublications[client] ? receivedPublications[client].length : 0}`);
    // Calculate #rec_pubs and erroneous results here if required
    console.log("-------------------------------------------------------");
}
