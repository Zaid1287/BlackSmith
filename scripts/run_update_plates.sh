#!/bin/bash
# Script to run the vehicle license plate update script

# Get the project root directory
ROOT_DIR=$(pwd)

# Execute the TypeScript file using tsx
echo "Running vehicle license plate update script..."
npx tsx $ROOT_DIR/scripts/update_vehicle_plates.ts

echo "Update process completed."