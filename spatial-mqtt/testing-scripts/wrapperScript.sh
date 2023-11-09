#!/bin/bash

# The path to the original script
SCRIPT_PATH="./run_and_retrieve.sh"
label=$(date "+%Y-%m-%d_%H-%M-%S")
BASE_DIR="/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2/${label}"
mkdir -p "${BASE_DIR}"

export BASE_DIR

# Array of all Raspberry Pi addresses
ALL_CLIENTS=(
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

# Export the BROKERS array as is if needed by the script
export BROKERS=(
    "herobrine47@192.168.1.197"
)

# Run the original script with an increasing number of clients
for (( i=1; i<=${#ALL_CLIENTS[@]}; i++ )); do
    # Select the first 'i' clients
    CLIENTS=("${ALL_CLIENTS[@]:0:i}")
    
    # Export the CLIENTS as an environment variable
    export CLIENTS_STR="${CLIENTS[*]}" # Convert array to string
    
    echo "Running with ${#CLIENTS[@]} clients: $CLIENTS_STR"
    
    # Run the original script
    /bin/bash "$SCRIPT_PATH"
    
    # Wait for a bit before starting the next run (optional)
    sleep 5
done

# ../mqtt-on-vast/analysis/get_summaries.sh

python3 ~/spatial-mqtt/mqtt-on-vast/analysis/extract_metrics.py "${BASE_DIR}"