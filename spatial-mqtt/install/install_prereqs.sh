#!/bin/bash

# Run the get_date.sh script
$HOME/spatial-mqtt/get-date/get_date.sh

# Check if the above script executed successfully
if [ $? -ne 0 ]; then
    echo "Error setting date and time. Exiting."
    exit 1
fi

# Update package and install lists
sudo apt-get update
sudo apt-get install -y git wget flex bison gperf python3 python3-venv cmake ninja-build ccache libffi-dev dfu-util libusb-1.0-0
sudo apt-get install -y nodejs npm

# Update Node
sudo npm install -g n
echo "Updating Node to version 20.6.1..."
sudo n 20.6.1
hash -r

# Make directories
mkdir -p $HOME/esp &
mkdir -p $HOME/repos &

wait

$HOME/spatial-mqtt/install/install_esp.sh & 
$HOME/spatial-mqtt/install/pull_aedes.sh &
$HOME/spatial-mqtt/install/pull_VAST.sh &
$HOME/spatial-mqtt/install/create_project.sh &

wait

# Run esp-idf to build, flash and monitor and add to .bashrc 
# script to run on every terminal when opened
. $HOME/esp/esp-idf/export.sh
echo "source /path/to/esp-idf/export.sh > /dev/null 2>&1" >> ~/.bashrc

# Install vast dependencies in MQTT packages to allow for 
# MQTT over VAST
cd $HOME/repos/aedes
npm install ../VAST.js

# Install dependencies for project
cd $HOME/spatial-mqtt/mqtt-on-vast
npm install