const fs = require('fs');

const aedesOpts = {
    VAST: false,
}

clear_logs_and_events()

const port = 1884

const aedes = require('aedes')(aedesOpts)

const server = require('net').createServer({}, aedes.handle)

server.listen(port, function () {
    console.log('server started and listening on port ', port)
})

aedes.on('clientError', function (client, err) {
    console.log('client error', client.id, err.message, err.stack)
})

aedes.on('connectionError', function (client, err) {
    console.log('client error', client, err.message, err.stack)
})

aedes.on('publish', function (packet, client) {
    if (client) {
        console.log('message from client', client.id)
    }
})

aedes.on('subscribe', function (subscriptions, client) {
    if (client) {
        console.log('subscribe from client', subscriptions, client.id)
}
})

aedes.on('client', function (client) {
    console.log('new client', client.id)
})

function clear_logs_and_events() {
    // Use the 'fs.writeFile' method to truncate (clear) the file
    const filesToDeleteContents = [
        'logs_and_events/Client_events.txt',
    ]
    
    // Loop through the list of files and overwrite them with an empty string
    filesToDeleteContents.forEach((filename) => {
        fs.writeFile(filename, '', (err) => {
            if (err) {
                console.error(`Error deleting contents of ${filename}:`, err)
            } else {
                console.log(`Contents of ${filename} cleared successfully.`)
            }
        })
    })
}