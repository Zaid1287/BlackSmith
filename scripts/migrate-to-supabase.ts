import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { storage } from '../server/storage';
import type { 
  User, Vehicle, Journey, Expense, 
  LocationHistory, Milestone, JourneyPhoto,
  Salary, SalaryHistory 
} from '../shared/schema';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration functions
async function migrateUsers() {
  console.log('Migrating users...');
  const users = await storage.getAllUsers();
  
  for (const user of users) {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        username: user.username,
        name: user.name,
        password: user.password,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt.toISOString()
      });
    
    if (error) {
      console.error(`Error migrating user ${user.id}:`, error);
    } else {
      console.log(`Migrated user: ${user.username}`);
    }
  }
}

async function migrateVehicles() {
  console.log('Migrating vehicles...');
  const vehicles = await storage.getAllVehicles();
  
  for (const vehicle of vehicles) {
    const { error } = await supabase
      .from('vehicles')
      .upsert({
        id: vehicle.id,
        licensePlate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        createdAt: vehicle.createdAt.toISOString()
      });
    
    if (error) {
      console.error(`Error migrating vehicle ${vehicle.id}:`, error);
    } else {
      console.log(`Migrated vehicle: ${vehicle.licensePlate}`);
    }
  }
}

async function migrateJourneys() {
  console.log('Migrating journeys...');
  const journeys = await storage.getAllJourneys();
  
  for (const journey of journeys) {
    const { error } = await supabase
      .from('journeys')
      .upsert({
        id: journey.id,
        userId: journey.userId,
        vehiclePlate: journey.vehiclePlate,
        startLocation: journey.startLocation,
        endLocation: journey.endLocation,
        startTime: journey.startTime.toISOString(),
        endTime: journey.endTime ? journey.endTime.toISOString() : null,
        status: journey.status,
        initialExpense: journey.initialExpense,
        pouch: journey.pouch,
        workingBalance: journey.workingBalance,
        isComplete: journey.isComplete,
        createdAt: journey.createdAt.toISOString()
      });
    
    if (error) {
      console.error(`Error migrating journey ${journey.id}:`, error);
    } else {
      console.log(`Migrated journey: ${journey.id}`);
    }
  }
}

async function migrateExpenses() {
  console.log('Migrating expenses...');
  const journeys = await storage.getAllJourneys();
  
  for (const journey of journeys) {
    const expenses = await storage.getExpensesByJourney(journey.id);
    
    for (const expense of expenses) {
      const { error } = await supabase
        .from('expenses')
        .upsert({
          id: expense.id,
          journeyId: expense.journeyId,
          type: expense.type,
          amount: expense.amount,
          description: expense.description,
          timestamp: expense.timestamp.toISOString(),
          createdAt: expense.createdAt.toISOString()
        });
      
      if (error) {
        console.error(`Error migrating expense ${expense.id}:`, error);
      } else {
        console.log(`Migrated expense: ${expense.id}`);
      }
    }
  }
}

async function migrateLocationHistory() {
  console.log('Migrating location history...');
  const journeys = await storage.getAllJourneys();
  
  for (const journey of journeys) {
    const locations = await storage.getLocationHistoryByJourney(journey.id);
    
    for (const location of locations) {
      const { error } = await supabase
        .from('location_history')
        .upsert({
          id: location.id,
          journeyId: location.journeyId,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp.toISOString(),
          speed: location.speed,
          createdAt: location.createdAt.toISOString()
        });
      
      if (error) {
        console.error(`Error migrating location ${location.id}:`, error);
      } else {
        console.log(`Migrated location: ${location.id}`);
      }
    }
  }
}

async function migrateMilestones() {
  console.log('Migrating milestones...');
  const journeys = await storage.getAllJourneys();
  
  for (const journey of journeys) {
    const milestones = await storage.getMilestonesByJourney(journey.id);
    
    for (const milestone of milestones) {
      const { error } = await supabase
        .from('milestones')
        .upsert({
          id: milestone.id,
          journeyId: milestone.journeyId,
          type: milestone.type,
          message: milestone.message,
          timestamp: milestone.timestamp.toISOString(),
          dismissed: milestone.dismissed,
          createdAt: milestone.createdAt.toISOString()
        });
      
      if (error) {
        console.error(`Error migrating milestone ${milestone.id}:`, error);
      } else {
        console.log(`Migrated milestone: ${milestone.id}`);
      }
    }
  }
}

async function migratePhotos() {
  console.log('Migrating journey photos...');
  const journeys = await storage.getAllJourneys();
  
  for (const journey of journeys) {
    const photos = await storage.getJourneyPhotosByJourney(journey.id);
    
    for (const photo of photos) {
      try {
        // First, upload the file to Supabase Storage
        const photoUrl = photo.photoUrl;
        const fileName = path.basename(photoUrl);
        
        // Skip if it's already a Supabase URL
        if (photoUrl.includes('supabase')) {
          console.log(`Photo ${photo.id} already in Supabase, skipping upload`);
          continue;
        }
        
        // For local files, upload to Supabase
        if (fs.existsSync(photoUrl)) {
          const fileBuffer = fs.readFileSync(photoUrl);
          const { data, error: uploadError } = await supabase
            .storage
            .from('journey-photos')
            .upload(`journey-${journey.id}/${fileName}`, fileBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });
          
          if (uploadError) {
            console.error(`Error uploading photo ${photo.id}:`, uploadError);
            continue;
          }
          
          // Get the public URL
          const { data: { publicUrl } } = supabase
            .storage
            .from('journey-photos')
            .getPublicUrl(`journey-${journey.id}/${fileName}`);
          
          // Now update the record in Supabase
          const { error } = await supabase
            .from('journey_photos')
            .upsert({
              id: photo.id,
              journeyId: photo.journeyId,
              photoUrl: publicUrl,
              timestamp: photo.timestamp.toISOString(),
              createdAt: photo.createdAt.toISOString()
            });
          
          if (error) {
            console.error(`Error migrating photo ${photo.id}:`, error);
          } else {
            console.log(`Migrated photo: ${photo.id}`);
          }
        } else {
          console.warn(`Photo file not found: ${photoUrl}`);
          
          // Still create the record but keep the original URL
          const { error } = await supabase
            .from('journey_photos')
            .upsert({
              id: photo.id,
              journeyId: photo.journeyId,
              photoUrl: photo.photoUrl,
              timestamp: photo.timestamp.toISOString(),
              createdAt: photo.createdAt.toISOString()
            });
          
          if (error) {
            console.error(`Error migrating photo ${photo.id}:`, error);
          } else {
            console.log(`Migrated photo record (without file): ${photo.id}`);
          }
        }
      } catch (err) {
        console.error(`Error processing photo ${photo.id}:`, err);
      }
    }
  }
}

async function migrateSalaries() {
  console.log('Migrating salaries...');
  const salaries = await storage.getAllSalaries();
  
  for (const salary of salaries) {
    const { error } = await supabase
      .from('salaries')
      .upsert({
        id: salary.id,
        userId: salary.userId,
        amount: salary.amount,
        paid: salary.paid,
        createdAt: salary.createdAt.toISOString(),
        updatedAt: salary.updatedAt.toISOString()
      });
    
    if (error) {
      console.error(`Error migrating salary ${salary.id}:`, error);
    } else {
      console.log(`Migrated salary for user: ${salary.userId}`);
    }
    
    // Now migrate salary history
    const salaryHistory = await storage.getSalaryHistoryByUser(salary.userId);
    
    for (const historyEntry of salaryHistory) {
      const { error } = await supabase
        .from('salary_history')
        .upsert({
          id: historyEntry.id,
          userId: historyEntry.userId,
          amount: historyEntry.amount,
          type: historyEntry.type,
          description: historyEntry.description,
          timestamp: historyEntry.timestamp.toISOString(),
          createdAt: historyEntry.createdAt.toISOString()
        });
      
      if (error) {
        console.error(`Error migrating salary history ${historyEntry.id}:`, error);
      } else {
        console.log(`Migrated salary history entry: ${historyEntry.id}`);
      }
    }
  }
}

// Main migration function
async function migrateData() {
  try {
    console.log('Starting data migration to Supabase...');
    
    // Start with core data
    await migrateUsers();
    await migrateVehicles();
    await migrateJourneys();
    
    // Then related data
    await migrateExpenses();
    await migrateLocationHistory();
    await migrateMilestones();
    await migratePhotos();
    await migrateSalaries();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up resources
    process.exit(0);
  }
}

// Run the migration
migrateData();