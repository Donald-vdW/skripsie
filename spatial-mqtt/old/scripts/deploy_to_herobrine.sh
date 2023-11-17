#!/bin/bash

# List of Raspberry Pi addresses
PIS=(
"herobrine47@192.168.1.197"
)

PASSWORD="herobrine"  # The sudo password

# Rsync directories to each Pi
for PI in "${PIS[@]}"; do
    echo "Deploying to $PI..."
    rsync -avz --exclude='**/node_modules/' -e ssh repos spatial-mqtt $PI:~/

    # Update time on the Pi
    ssh $PI "$HOME/spatial-mqtt/get-date/get_date.sh"

    # Install NodeJS and update to specified version
    ssh $PI << EOF
        echo $PASSWORD | sudo -S apt-get update
        echo $PASSWORD | sudo -S apt-get install -y nodejs npm
        echo $PASSWORD | sudo -S npm install -g n
        echo "Updating Node to version 20.6.1..."
        echo $PASSWORD | sudo -S n 20.6.1
        hash -r
EOF

    # Run 'npm install' in the specified directories
    ssh $PI << EOF
        cd ~/repos/VAST.js/ && npm install
        cd ~/repos/aedes/ && npm install
        cd ~/spatial-mqtt/mqtt-on-vast/ && npm install
EOF

done

echo "Deployment completed for all Pis."
