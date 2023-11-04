const fs = require('fs');

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function circlesOverlap(sub, pub) {
    return distance(sub.x, sub.y, pub.x, pub.y) < (sub.r + pub.r);
}

function analyzeClientEvents(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const events = [];
    const clients = {};
    const subscriptions = {};
    const sent_publications = {};
    const rec_publications = {};

    // Parse and organize the data
    lines.forEach(line => {
        if (line) {
            const record = JSON.parse(line);
            events.push(record);

            const clientId = record.id;
            const eventType = record.event;

            if (!clients[clientId]) {
                clients[clientId] = {
                    subscriptions: [],
                    sentPublications: [],
                    receivedPublications: [],
                    eventCount: 0
                };
            }

            clients[clientId].eventCount++;

            if (eventType === 6) {
                const subId = record.sub.subID;
                clients[clientId].subscriptions.push(subId);
                subscriptions[subId] = record.sub;
            } else if (eventType === 9) {
                const pubId = record.pub.pubID;
                clients[clientId].sentPublications.push(pubId);
                sent_publications[pubId] = record.pub;
            } else if (eventType === 10) {
                const pubId = record.pub.pubID;
                clients[clientId].receivedPublications.push(pubId);
                if (!rec_publications[pubId]) {
                    rec_publications[pubId] = [];
                }
                rec_publications[pubId].push(clientId);
            }
        }
    });

    const correctlyReceived = [];
    const duplicates = [];

    Object.keys(rec_publications).forEach(pubId => {
        const pub = sent_publications[pubId];
        let correctlyReceivedFlag = false;

        Object.keys(subscriptions).forEach(subId => {
            const sub = subscriptions[subId];
            if (circlesOverlap(sub, pub) && sub.channel === pub.channel) {
                correctlyReceived.push(pubId);
                correctlyReceivedFlag = true;
            }
        });

        if (!correctlyReceivedFlag) {
            duplicates.push(pubId);
        }
    });

    const undelivered = Object.keys(sent_publications).filter(pubId => {
        if (!correctlyReceived.includes(pubId)) {
            return true; // undelivered
        }
        return false; // delivered
    });

    const undeliveredDetails = {};
    undelivered.forEach(pubId => {
        const pub = sent_publications[pubId];
        const matchingSubscriptions = [];

        Object.keys(subscriptions).forEach(subId => {
            const sub = subscriptions[subId];
            if (circlesOverlap(sub, pub) && sub.channel === pub.channel) {
                matchingSubscriptions.push(subId);
            }
        });

        undeliveredDetails[pubId] = {
            supposedToBeDeliveredTo: matchingSubscriptions
        };
    });

    return {
        totalClients: Object.keys(clients).length,
        totalEvents: events.length,
        totalSentPublications: Object.keys(sent_publications).length,
        totalReceivedPublications: Object.keys(rec_publications).length,
        totalSubscriptions: Object.keys(subscriptions).length,
        correctlyReceived: correctlyReceived.length,
        incorrectlyReceived: duplicates.length,
        duplicates: duplicates,
        undelivered: undelivered.length,
        undeliveredDetails: undeliveredDetails
    };
}

const analysisResult = analyzeClientEvents('../logs_and_events/Client_events.txt');
console.log(JSON.stringify(analysisResult, null, 2));
