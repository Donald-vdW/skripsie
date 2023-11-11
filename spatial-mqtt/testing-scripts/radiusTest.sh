#!/bin/bash

# Array of radius values
RADIUS_VALUES=(5 10 15 20 25 30 35 40 45 50)

# Path to the modified script
SCRIPT_PATH="./run_and_retrieve.sh"

# The path to the original script
label=$(date "+%Y-%m-%d_%H-%M-%S")

mkdir -p "/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2/${label}"



export BASE_DIR

for radius in "${RADIUS_VALUES[@]}"; do

    BASE_DIR="/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2/${label}/radius-${radius}"
    mkdir -p "${BASE_DIR}"

    echo "Running script with radius: $radius"
    export radius
    /bin/bash "$SCRIPT_PATH" 
done
