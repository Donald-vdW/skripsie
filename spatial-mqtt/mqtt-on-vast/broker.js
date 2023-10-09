const aedesOpts = {
    VAST: true,
    VASTGateway: true,
    VASTx:250,
    VASTy:500,
    VASTport:8000,
    VASTradius:50
}

const aedes = require('aedes')(aedesOpts)
//const { createServer } = require('aedes-server-factory')
const port = 1884

const server = require('net').createServer({}, aedes.handle)

//const server = createServer(aedes)

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