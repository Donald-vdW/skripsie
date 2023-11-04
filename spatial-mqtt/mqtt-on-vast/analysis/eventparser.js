const fs = require('fs');

function parseTextile(textileContent) {
    const events = textileContent.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
    events.sort((a, b) => a.time - b.time);

    const activeSubscriptions = {};
    const publications = [];
    const receivedPublications = {};

    for (const event of events) {
        switch (event.event) {
            case 6: // New subscription
                activeSubscriptions[event.sub.subID] = event.sub;
                break;
            case 8: // Subscription deleted
                delete activeSubscriptions[event.subID];
                break;
            case 9: // Publication made
                publications.push(event.pub);
                break;
            case 10: // Publication received
                if (!receivedPublications[event.pub.pubID]) {
                    receivedPublications[event.pub.pubID] = [];
                }
                receivedPublications[event.pub.pubID].push(event.pub.subID);
                break;
        }
    }

    let type1Errors = 0;
    let type2Errors = 0;
    let type3Errors = 0;

    for (const pub of publications) {
        let expectedReceives = 0;
        for (const subID in activeSubscriptions) {
            const sub = activeSubscriptions[subID];
            if (pub.channel === sub.channel && overlap(pub.aoi, sub.aoi)) {
                expectedReceives++;
            }
        }
        const actualReceives = receivedPublications[pub.pubID] ? receivedPublications[pub.pubID].length : 0;
        if (actualReceives < expectedReceives) {
            type1Errors += (expectedReceives - actualReceives);
        } else if (actualReceives > expectedReceives) {
            type2Errors += (actualReceives - expectedReceives);
        }
    }

    // Count type 3 errors (Unwanted publications)
    for (const pubID in receivedPublications) {
        if (!publications.some(pub => pub.pubID === pubID)) {
            type3Errors += receivedPublications[pubID].length;
        }
    }

    return {
        numberOfEvents: events.length,
        numberOfClients: new Set(events.map(e => e.id)).size,
        numberOfPublicationsSent: publications.length,
        numberOfPublicationsDelivered: Object.values(receivedPublications).reduce((acc, arr) => acc + arr.length, 0),
        numberOfPublicationsExpected: publications.length + type1Errors - type2Errors,
        type1Errors: type1Errors,
        type2Errors: type2Errors,
        type3Errors: type3Errors
    };
}


function overlap(aoi1, aoi2) {
    const dist = Math.sqrt(Math.pow(aoi1.center.x - aoi2.center.x, 2) + Math.pow(aoi1.center.y - aoi2.center.y, 2));
    return dist <= (aoi1.radius + aoi2.radius);
}

// Test with the given textile
fs.readFile('../logs_and_events/Client_events.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }
    const result = parseTextile(data);
    console.log(result);
});
