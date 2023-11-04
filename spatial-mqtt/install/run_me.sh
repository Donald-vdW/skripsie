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

# Update Node
$HOME/spatial-mqtt/install/install_update_node.sh

