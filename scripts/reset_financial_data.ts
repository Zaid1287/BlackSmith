// Manual script to reset financial data by archiving completed journeys
import { db } from "../server/db";
import { journeys } from "../shared/schema";
import { eq } from "drizzle-orm";

async function resetFinancialData() {
  console.log("Starting manual financial data reset process...");
  
  try {
    // 1. Get all completed and unarchived journeys
    const allJourneys = await db.select().from(journeys);
    const completedJourneys = allJourneys.filter(journey => 
      journey.status === 'completed' && journey.archived === false
    );
    
    console.log(`Found ${completedJourneys.length} completed journeys to archive`);
    
    // 2. Archive all completed journeys (set archive flag)
    for (const journey of completedJourneys) {
      console.log(`Archiving journey ID: ${journey.id}`);
      
      try {
        await db
          .update(journeys)
          .set({ archived: true })
          .where(eq(journeys.id, journey.id));
        
        console.log(`Successfully archived journey ${journey.id}`);
      } catch (updateError: any) {
        console.error(`Failed to archive journey ${journey.id}:`, updateError.message);
      }
    }
    
    console.log("Financial data reset completed successfully!");
    console.log(`Total journeys archived: ${completedJourneys.length}`);
  } catch (error: any) {
    console.error("Error during financial data reset:", error.message);
  }
}

// Execute the reset function
resetFinancialData()
  .then(() => {
    console.log("Reset operation finished");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal error during reset:", err);
    process.exit(1);
  });