#!/bin/bash

# List of Raspberry Pi addresses
CLIENTS=(
    "pi@192.168.1.53"
    "pi@192.168.1.54"
    "pi@192.168.1.60"
    "pi@192.168.1.61"
    "pi@192.168.1.64"
    "pi@192.168.1.65"
    "pi@192.168.1.68"
    "pi@192.168.1.70"
)

BROKERS=(
    "herobrine47@192.168.1.197"
)

# GATEWAY="herobrine47@192.168.1.197"

rm -f ~/spatial-mqtt/mqtt-on-vast/logs_and_events/*

# echo "Starting gateway..."
# ssh $GATEWAY "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node gateway.js > output.log 2> error.log" &

echo "Starting brokers..."
for BROKER in "${BROKERS[@]}"; do
    echo "Starting broker on $BROKER..."
    (ssh $BROKER "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node gateway.js > output.log 2> error.log" &) 2>/dev/null
    echo $!
done
sleep 10

echo "Starting node script on all Pis..."
# Start the node scripts on all Pis simultaneously
for CLIENT in "${CLIENTS[@]}"; do
    echo "Starting node script on $CLIENT..."
    ssh $CLIENT "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node spatial-client.js > output.log 2> error.log" &
done

sleep 2

# Start spTest.js on your PC and wait for it to finish
echo "Starting spTest.js on PC..."
cd ~/spatial-mqtt/mqtt-on-vast/
node ~/spatial-mqtt/mqtt-on-vast/spTest.js &
wait $!
sleep 2

# After all scripts have completed, retrieve the event files
for CLIENT in "${CLIENTS[@]}"; do
    # Extract the last octet of the IP to use as a port number
    PI_NUM=$(echo $CLIENT | cut -d'.' -f4)

    # Rsync the event file back to the PC
    echo "Retrieving Events from $CLIENT..."
    rsync -avz -e ssh $CLIENT:~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_events.txt ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_events_$PI_NUM.txt
    cat  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_events_$PI_NUM.txt >>  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_events.txt

    # Rsync the event file back to the PC
    echo "Retrieving Logs from $CLIENT..."
    rsync -avz -e ssh $CLIENT:~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs.txt ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs_$PI_NUM.txt
    cat  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs_$PI_NUM.txt >>  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs.txt
done

# Retrieve the event file from the gateway
# echo "Retrieving logs from $GATEWAY..."
# GATEWAY_NUM=$(echo $GATEWAY | cut -d'.' -f4)
# rsync -avz -e ssh $GATEWAY:~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events.txt ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events_$GATEWAY_NUM.txt
# cat  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events_$GATEWAY_NUM.txt >>  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events.txt

for BROKER in "${BROKERS[@]}"; do
    # Extract the last octet of the IP to use as a port number
    BROKER_NUM=$(echo $BROKER | cut -d'.' -f4)

    # Rsync the event file back to the PC
    echo "Retrieving events from $BROKER..."
    rsync -avz -e ssh $BROKER:~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events.txt ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events_$BROKER_NUM.txt
    cat  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events_$BROKER_NUM.txt >>  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_events.txt

    echo "Retrieving logs from $BROKER..."
    rsync -avz -e ssh $BROKER:~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_logs.txt ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_logs_$BROKER_NUM.txt
    cat  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_logs_$BROKER_NUM.txt >>  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Matcher_logs.txt

    ssh $BROKER "cd ~/spatial-mqtt/mqtt-on-vast/ && kill -9 \$(lsof -t -i :1884)" &
done

# kill $BROKER_PID

echo "Execution and retrieval completed for all Devices!"