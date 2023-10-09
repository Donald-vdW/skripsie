#!/bin/bash

# Paths
PATH_TO_DATE_FILE="$HOME/spatial-mqtt/get-date/datefile.txt"
PATH_TO_PYTHON_SCRIPT="$HOME/spatial-mqtt/get-date/get_date.py"

# Function to read the password securely
# read -s -p "Enter your sudo password: " SUDO_PASSWORD
SUDO_PASSWORD="raspberry"

# If the date file exists, read it and set the system date/time to its value
if [ -f "$PATH_TO_DATE_FILE" ]; then
    STORED_DATE=$(cat $PATH_TO_DATE_FILE)
    echo "$SUDO_PASSWORD" | sudo -S date $STORED_DATE
fi

# Fetch date and time using Python script
DATE_TIME_FROM_WEB=$(echo "$SUDO_PASSWORD" | sudo -S -u root /usr/bin/python3 $PATH_TO_PYTHON_SCRIPT)

# Update system date and time based on the fetched value
if [ "$DATE_TIME_FROM_WEB" != "Error fetching date and time" ] && [ ! -z "$DATE_TIME_FROM_WEB" ]; then
    echo "$SUDO_PASSWORD" | sudo -S date $DATE_TIME_FROM_WEB
    # Update the date file with the new date/time
    echo $DATE_TIME_FROM_WEB > $PATH_TO_DATE_FILE
else
    echo "Failed to fetch the date and time."
fi
