const mqtt = require(`mqtt`)
require(`./client/common`)

const client = mqtt.connect(`mqtt://${BROKER}:${PORT}`)
const testTopic = `Test`

function startTest(){
    startMsg = `Start Test`
    client.publish(testTopic, startMsg)
}

function endTest(){
    endMsg = `End Test`
    client.publish(testTopic, endMsg)
}

setTimeout(
    async function () {
        console.log(`Ending test...`)
        await endTest()
        client.end()
        process.exit(0)
    },
    360000
    // 2000
)

startTest()