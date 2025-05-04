// Script to update vehicle license plates
import { db } from "../server/db";
import { vehicles, journeys } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

// New license plates provided by the user
const NEW_LICENSE_PLATES = [
  "TS16UD1468",
  "TS16UD1506",
  "TG16T1469",
  "TG16T1507",
  "TG16T3001",
  "TG16T2760"
];

async function updateVehiclePlates() {
  console.log("Starting vehicle license plate update process...");
  
  try {
    // Get all existing vehicles
    const allVehicles = await db.select().from(vehicles);
    console.log(`Found ${allVehicles.length} vehicles in the database`);
    
    // Make sure we have enough new plates
    if (allVehicles.length > NEW_LICENSE_PLATES.length) {
      console.error(`Error: Not enough new license plates (${NEW_LICENSE_PLATES.length}) to replace all vehicles (${allVehicles.length})`);
      return;
    }
    
    // Create a mapping of old to new license plates
    const licensePlateMap = new Map();
    
    // Update each vehicle with a new license plate
    for (let i = 0; i < allVehicles.length; i++) {
      const vehicle = allVehicles[i];
      const oldPlate = vehicle.licensePlate;
      const newPlate = NEW_LICENSE_PLATES[i];
      
      licensePlateMap.set(oldPlate, newPlate);
      
      console.log(`Will update vehicle ID ${vehicle.id} from ${oldPlate} to ${newPlate}`);
    }
    
    // We need to use a transaction to ensure consistency
    await db.transaction(async (tx) => {
      console.log("Starting database transaction...");
      
      // First update all journey references
      for (const [oldPlate, newPlate] of licensePlateMap.entries()) {
        console.log(`Updating journeys with license plate ${oldPlate} to ${newPlate}`);
        
        // Using raw SQL here to handle the update more easily
        await tx.execute(
          sql`UPDATE journeys SET vehicle_license_plate = ${newPlate} WHERE vehicle_license_plate = ${oldPlate}`
        );
        
        console.log(`Successfully updated journeys with license plate ${oldPlate}`);
      }
      
      // Now update the vehicles
      for (const [oldPlate, newPlate] of licensePlateMap.entries()) {
        console.log(`Updating vehicle with license plate ${oldPlate} to ${newPlate}`);
        
        await tx
          .update(vehicles)
          .set({ licensePlate: newPlate })
          .where(eq(vehicles.licensePlate, oldPlate));
        
        console.log(`Successfully updated vehicle with license plate ${oldPlate}`);
      }
      
      console.log("Transaction completed successfully");
    });
    
    console.log(`Vehicle license plate update completed successfully!`);
    console.log(`Updated ${allVehicles.length} vehicles with new license plates`);
  } catch (error: any) {
    console.error("Error updating vehicle license plates:", error.message);
    console.error(error.stack);
  }
}

// Execute the update function
updateVehiclePlates()
  .then(() => {
    console.log("Update operation finished");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal error during update:", err);
    process.exit(1);
  });