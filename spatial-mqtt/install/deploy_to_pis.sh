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
)

# Rsync directories to each Pi
for DEVICE in "${DEVICES[@]}"; do
    echo "Deploying to $DEVICE..."
    rsync -avz --exclude='**/node_modules/' -e ssh ~/repos ~/spatial-mqtt $DEVICE:~/

    # Update time on the Pi

    # Install NodeJS and update to specified version
    ssh $DEVICE << EOF
        ~/spatial-mqtt/get-date/get_date.sh
        sudo apt-get update
        sudo apt-get install -y nodejs npm
        sudo npm install -g n
        echo "Updating Node to version 20.6.1..."
        sudo n 20.6.1
        hash -r
        cd ~/repos/VAST.js/ && npm install
        cd ~/repos/aedes/ && npm install
        cd ~/spatial-mqtt/mqtt-on-vast/ && npm install
EOF

done

echo "Deployment completed for all Pis."
