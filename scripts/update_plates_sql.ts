// Script to update vehicle license plates using direct SQL with constraint management
import { getPool } from "../server/db";
const pool = getPool();

// New license plates provided by the user
const NEW_LICENSE_PLATES = [
  "TS16UD1468",
  "TS16UD1506",
  "TG16T1469",
  "TG16T1507",
  "TG16T3001",
  "TG16T2760"
];

async function updateVehiclePlatesWithSQL() {
  console.log("Starting vehicle license plate update process with direct SQL...");
  
  // Get a client from the pool
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    console.log("Transaction started");
    
    // Get all existing vehicles
    const vehiclesResult = await client.query('SELECT id, license_plate FROM vehicles ORDER BY id');
    const vehicles = vehiclesResult.rows;
    console.log(`Found ${vehicles.length} vehicles in the database`);
    
    // Make sure we have enough new plates
    if (vehicles.length > NEW_LICENSE_PLATES.length) {
      console.error(`Error: Not enough new license plates (${NEW_LICENSE_PLATES.length}) to replace all vehicles (${vehicles.length})`);
      await client.query('ROLLBACK');
      return;
    }
    
    // Create a mapping of old to new license plates
    const licensePlateMap = new Map();
    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      const oldPlate = vehicle.license_plate;
      const newPlate = NEW_LICENSE_PLATES[i];
      licensePlateMap.set(oldPlate, newPlate);
      console.log(`Will update vehicle ID ${vehicle.id} from ${oldPlate} to ${newPlate}`);
    }
    
    // Temporarily drop the foreign key constraint
    console.log("Temporarily dropping foreign key constraint...");
    await client.query('ALTER TABLE journeys DROP CONSTRAINT journeys_vehicle_license_plate_vehicles_license_plate_fk');
    
    // Update all affected journeys
    for (const [oldPlate, newPlate] of licensePlateMap.entries()) {
      console.log(`Updating journeys with license plate ${oldPlate} to ${newPlate}`);
      await client.query(
        'UPDATE journeys SET vehicle_license_plate = $1 WHERE vehicle_license_plate = $2',
        [newPlate, oldPlate]
      );
    }
    
    // Now update the vehicles
    for (const [oldPlate, newPlate] of licensePlateMap.entries()) {
      console.log(`Updating vehicle with license plate ${oldPlate} to ${newPlate}`);
      await client.query(
        'UPDATE vehicles SET license_plate = $1 WHERE license_plate = $2',
        [newPlate, oldPlate]
      );
    }
    
    // Recreate the foreign key constraint
    console.log("Recreating foreign key constraint...");
    await client.query(`
      ALTER TABLE journeys 
      ADD CONSTRAINT journeys_vehicle_license_plate_vehicles_license_plate_fk
      FOREIGN KEY (vehicle_license_plate) 
      REFERENCES vehicles(license_plate)
    `);
    
    // Commit the transaction
    console.log("Committing transaction...");
    await client.query('COMMIT');
    
    console.log(`Vehicle license plate update completed successfully!`);
    console.log(`Updated ${vehicles.length} vehicles with new license plates`);
  } catch (error: any) {
    // Roll back the transaction in case of error
    await client.query('ROLLBACK');
    console.error("Error updating vehicle license plates:", error.message);
    console.error(error.stack);
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Execute the update function
updateVehiclePlatesWithSQL()
  .then(() => {
    console.log("Update operation finished");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal error during update:", err);
    process.exit(1);
  });