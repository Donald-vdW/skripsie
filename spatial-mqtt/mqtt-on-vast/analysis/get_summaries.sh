#!/bin/bash

# Base directory
BASE_DIR="/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2"

# Base file name
BASE_NAME="Client_events"

# Loop over the numbers 1 through 8
for i in {1..21}
do
    # Construct the full filename
    FILE_NAME="${BASE_DIR}/${BASE_NAME}${i}.txt"
    
    # Construct the output filename
    OUTPUT_FILE="${BASE_DIR}/Output_${i}.txt"
    
    # Run the python script with the constructed filename and redirect output
    python3 ~/spatial-mqtt/mqtt-on-vast/analysis/fromScratch.py "$FILE_NAME" > "$OUTPUT_FILE"
    
    # Inform the user that the operation is complete for this file
    echo "Processed $FILE_NAME and saved output to $OUTPUT_FILE"
done

# Inform the user that all operations are complete
echo "All files processed."
