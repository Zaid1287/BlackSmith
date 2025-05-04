#!/bin/bash
# Script to run the TypeScript reset script

# Get the project root directory
ROOT_DIR=$(pwd)

# Execute the TypeScript file using tsx
echo "Running financial data reset script..."
npx tsx $ROOT_DIR/scripts/reset_financial_data.ts

echo "Reset process completed."