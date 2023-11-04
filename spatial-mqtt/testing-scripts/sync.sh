#!/bin/bash

# List of Raspberry Pi addresses
DEVICES=(
"pi@192.168.1.53"
"pi@192.168.1.54"
"pi@192.168.1.60"
"pi@192.168.1.61"
"pi@192.168.1.64"
"pi@192.168.1.65"
"pi@192.168.1.68"
"pi@192.168.1.70"
"herobrine47@192.168.1.197"
)



for DEVICE in "${DEVICES[@]}"; do
    NUMBER=$(echo $DEVICE | cut -d'.' -f4)

    sed -i.bak "s/const _alias = \`C1\`/const _alias = \`C$NUMBER\`/" ~/spatial-mqtt/mqtt-on-vast/spatial-client.js

    rsync -avz --delete --exclude='**/node_modules/' --exclude='**/logs_and_events/' ~/spatial-mqtt/mqtt-on-vast/ $DEVICE:~/spatial-mqtt/mqtt-on-vast/
    rsync -avz --delete --exclude='**/node_modules/' --exclude='**/logs_and_events/' ~/repos/ $DEVICE:~/repos/
    # Correcting the file name here:
    mv ~/spatial-mqtt/mqtt-on-vast/spatial-client.js.bak ~/spatial-mqtt/mqtt-on-vast/spatial-client.js

done

echo "Devices synced."