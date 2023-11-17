#!/bin/bash

# List of Raspberry Pi addresses
# If CLIENTS_STR is not empty, read it into the array, otherwise use the default list
if [[ -n "$CLIENTS_STR" ]]; then
    IFS=' ' read -r -a CLIENTS <<< "$CLIENTS_STR"
else
    CLIENTS=(
        "pi@192.168.1.53"
        "pi@192.168.1.54"
        "pi@192.168.1.60"
        "pi@192.168.1.61"
        "pi@192.168.1.64"
        "pi@192.168.1.65"
        "pi@192.168.1.68"
        "pi@192.168.1.70"
        "pi@192.168.1.84"
        "pi@192.168.1.85"
        "pi@192.168.1.86"
        "pi@192.168.1.87"
        "pi@192.168.1.88"
        "pi@192.168.1.89"
        "pi@192.168.1.90"
        "pi@192.168.1.91"
        "pi@192.168.1.92"
        "pi@192.168.1.93"
        "pi@192.168.1.94"
        "pi@192.168.1.95"
        "pi@192.168.1.96"
    )
fi

# Check if BASE_DIR is already set
if [ -z "$BASE_DIR" ]; then

    # BASE_DIR is not set, so define it with your default value
    label=$(date "+%Y-%m-%d_%H-%M-%S")
    # label="2023-11-10_16-53-42"
    BASE_DIR="/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2/${label}"
    # mkdir -p "${BASE_DIR}"

    echo "BASE_DIR was not set. Using default: $BASE_DIR"
else

    echo "Using existing BASE_DIR: $BASE_DIR"
fi

# Check if radius is already set
if [ -z "$radius" ]; then
    radius=25
    BASE_DIR="/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2/${label}/radius-${radius}"
    mkdir -p "${BASE_DIR}"

    echo "Radius was not set. Using default: $radius"
else
    echo "Using existing radius: $radius"
fi

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
    (ssh $BROKER "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node examples/gateway.js > output.log 2> error.log" &) 2>/dev/null
    # (ssh $BROKER "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node broker.js > output.log 2> error.log" &) 2>/dev/null
    echo $!
done
sleep 2

echo "Starting node script on all Pis..."
# Start the node scripts on all Pis simultaneously
for CLIENT in "${CLIENTS[@]}"; do
    echo "Starting node script on $CLIENT..."
    # ssh $CLIENT "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node normalRate.js > output.log 2> error.log" &
    # ssh $CLIENT "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node spatial-client.js > output.log 2> error.log" &
    ssh $CLIENT "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node examples/organised.js $radius > output.log 2> error.log" &
    # ssh $CLIENT "cd ~/spatial-mqtt/mqtt-on-vast/ && rm -rf logs_and_events && nohup node normal-topic.js > output.log 2> error.log" &
done

sleep 2

# Start spTest.js on your PC and wait for it to finish
echo "Starting spTest.js on PC..."
cd ~/spatial-mqtt/mqtt-on-vast/
node ~/spatial-mqtt/mqtt-on-vast/examples/spTest.js &
# node ~/spatial-mqtt/mqtt-on-vast/nspTest.js &
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
    # rsync -avz -e ssh $CLIENT:~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs.txt ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs_$PI_NUM.txt
    # cat  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs_$PI_NUM.txt >>  ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_logs.txt
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
NUM_CLIENTS=${#CLIENTS[@]}

echo "Base directory: \"$BASE_DIR\""
# Base file name
BASE_NAME="Client_events"

FILE_NAME="${BASE_DIR}/${BASE_NAME}${NUM_CLIENTS}.txt"

rsync -avz ~/spatial-mqtt/mqtt-on-vast/logs_and_events/Client_events.txt "${FILE_NAME}"

# Construct the full filename

# Construct the output filename
OUTPUT_FILE="${BASE_DIR}/Output_${NUM_CLIENTS}.txt"

# Run the python script with the constructed filename and redirect output
python3 ~/spatial-mqtt/mqtt-on-vast/analysis/ClientEventParser.py "$FILE_NAME" > "$OUTPUT_FILE" &

# Inform the user that the operation is complete for this file
echo "Processed $FILE_NAME and saved output to $OUTPUT_FILE"

echo "Execution and retrieval completed for all Devices!"