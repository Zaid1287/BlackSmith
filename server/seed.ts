import { db } from './db';
import { storage } from './storage';
import { users, vehicles, journeys } from '@shared/schema';
import { hashPassword } from './auth';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (!existingAdmin) {
      console.log('Creating admin user...');
      await storage.createUser({
        username: 'admin',
        password: await hashPassword('admin123'),
        name: 'Admin User',
        isAdmin: true
      });
    }

    // Check if driver user exists
    const existingDriver = await storage.getUserByUsername('driver');
    
    if (!existingDriver) {
      console.log('Creating driver user...');
      await storage.createUser({
        username: 'driver',
        password: await hashPassword('driver123'),
        name: 'Test Driver',
        isAdmin: false
      });
    }

    // Add some vehicles if they don't exist
    const existingVehicles = await storage.getAllVehicles();
    
    const vehiclesToAdd = [
      { licensePlate: 'TS16UD1468', model: 'Tata Ace' },
      { licensePlate: 'TS16UD1506', model: 'Ashok Leyland Dost' },
      { licensePlate: 'TG16T1469', model: 'Mahindra Bolero Pickup' },
      { licensePlate: 'TG16T1507', model: 'Eicher Pro 1055' },
      { licensePlate: 'TG16T3001', model: 'Tata 407' }
    ];
    
    for (const vehicle of vehiclesToAdd) {
      const exists = existingVehicles.some(v => v.licensePlate === vehicle.licensePlate);
      
      if (!exists) {
        console.log(`Creating vehicle ${vehicle.licensePlate}...`);
        await storage.createVehicle({
          licensePlate: vehicle.licensePlate,
          model: vehicle.model,
          status: 'available'
        });
      }
    }

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}