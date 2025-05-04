#!/bin/bash
# Script to run the vehicle license plate update script with SQL approach

# Get the project root directory
ROOT_DIR=$(pwd)

# Execute the TypeScript file using tsx
echo "Running vehicle license plate update SQL script..."
npx tsx $ROOT_DIR/scripts/update_plates_sql.ts

echo "Update process completed."