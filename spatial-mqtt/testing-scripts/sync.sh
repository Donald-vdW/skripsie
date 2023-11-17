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
    "herobrine47@192.168.1.197"
)



for DEVICE in "${DEVICES[@]}"; do
    NUMBER=$(echo $DEVICE | cut -d'.' -f4)

    sed -i.bak "s/const _alias = \`C1\`/const _alias = \`C$NUMBER\`/" ~/spatial-mqtt/mqtt-on-vast/examples/organised.js
    sed -i.bak "s/const _alias = \`C1\`/const _alias = \`C$NUMBER\`/" ~/spatial-mqtt/mqtt-on-vast/examples/normal-topic.js

    rsync -avz --delete --exclude='**/node_modules/' --exclude='**/logs_and_events/' ~/spatial-mqtt/mqtt-on-vast/ $DEVICE:~/spatial-mqtt/mqtt-on-vast/
    rsync -avz --delete --exclude='**/node_modules/' --exclude='**/logs_and_events/' ~/repos/ $DEVICE:~/repos/
    # Correcting the file name here:
    mv ~/spatial-mqtt/mqtt-on-vast/examples/organised.js.bak ~/spatial-mqtt/mqtt-on-vast/examples/organised.js
    mv ~/spatial-mqtt/mqtt-on-vast/examples/normal-topic.js.bak ~/spatial-mqtt/mqtt-on-vast/examples/normal-topic.js

done

echo "Devices synced."