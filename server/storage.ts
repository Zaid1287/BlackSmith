import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { and, eq, desc, isNull, count } from 'drizzle-orm';
import { 
  users, vehicles, journeys, expenses, locationHistory, milestones, journeyPhotos,
  type User, type InsertUser,
  type Vehicle, type InsertVehicle,
  type Journey, type InsertJourney,
  type Expense, type InsertExpense,
  type LocationHistory, type InsertLocation,
  type Milestone, type InsertMilestone,
  type JourneyPhoto, type InsertJourneyPhoto
} from '@shared/schema';
import { db, getPool } from './db';
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Salary operations
  getUserSalary(userId: number): Promise<Salary | undefined>;
  updateUserSalary(userId: number, salaryData: Partial<Salary>): Promise<Salary>;
  getAllSalaries(): Promise<Salary[]>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getAllVehicles(): Promise<Vehicle[]>;
  updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Journey operations
  getJourney(id: number): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  getAllJourneys(): Promise<Journey[]>;
  getActiveJourneys(): Promise<Journey[]>;
  getJourneysByUser(userId: number): Promise<Journey[]>;
  getJourneyByVehicle(licensePlate: string): Promise<Journey | undefined>;
  updateJourney(id: number, journey: Partial<Journey>): Promise<Journey | undefined>;
  endJourney(id: number): Promise<Journey | undefined>;
  
  // Expense operations
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByJourney(journeyId: number): Promise<Expense[]>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Location operations
  getLatestLocation(journeyId: number): Promise<LocationHistory | undefined>;
  createLocation(location: InsertLocation): Promise<LocationHistory>;
  getLocationHistoryByJourney(journeyId: number): Promise<LocationHistory[]>;
  
  // Milestone operations
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  getMilestonesByJourney(journeyId: number): Promise<Milestone[]>;
  getActiveMilestonesByJourney(journeyId: number): Promise<Milestone[]>;
  dismissMilestone(id: number): Promise<Milestone | undefined>;
  
  // Journey Photo operations
  getJourneyPhoto(id: number): Promise<JourneyPhoto | undefined>;
  createJourneyPhoto(photo: InsertJourneyPhoto): Promise<JourneyPhoto>;
  getJourneyPhotosByJourney(journeyId: number): Promise<JourneyPhoto[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: getPool(),
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      isAdmin: user.isAdmin ?? false // Default to regular user if not specified
    }).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      console.log(`Attempting to delete user with ID: ${id}`);
      
      // Delete the user directly, let the database constraints handle rejection if needed
      const result = await db.delete(users).where(eq(users.id, id));
      console.log(`User ${id} deleted successfully`);
      
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      
      // Check if this is a foreign key constraint error
      const errorMessage = (error as Error).toString();
      if (errorMessage.includes('foreign key constraint') || 
          errorMessage.includes('violates foreign key constraint')) {
        throw new Error(`Cannot delete user with ID ${id} because they have associated journeys. Please delete the journeys first.`);
      }
      
      throw error;
    }
  }
  
  // Special method to handle users with journeys
  async forceDeleteUserWithJourneys(id: number): Promise<{success: boolean, message: string, affectedJourneys: number}> {
    try {
      console.log(`Attempting to handle deletion of user with ID: ${id}`);
      
      // Begin a database transaction to ensure data consistency
      return await db.transaction(async (tx) => {
        // First, check if the user exists
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, id));
          
        if (!user) {
          return {
            success: false, 
            message: `User with ID ${id} not found`, 
            affectedJourneys: 0
          };
        }
        
        // Get the user's name to preserve it
        const userName = user.name;
        
        // Find all journeys associated with this user
        const journeysToUpdate = await tx
          .select()
          .from(journeys)
          .where(eq(journeys.userId, id));
        
        console.log(`Found ${journeysToUpdate.length} journeys for user ${id} (${userName})`);
        
        // Instead of deleting the user, we'll update it to mark it as "deleted"
        // This way all foreign key constraints remain valid
        await tx.update(users)
          .set({ 
            name: `DELETED: ${userName}`,
            username: `deleted_${user.username}_${id}`,
            password: 'ACCOUNT_DELETED', // Make the account inoperable
            isAdmin: false // Remove admin privileges if any
          })
          .where(eq(users.id, id));
        
        // For each journey, add a system expense note
        for (const journey of journeysToUpdate) {
          // Create a special expense entry to mark that this journey's driver was deleted
          await tx.insert(expenses).values({
            journeyId: journey.id,
            type: 'system',
            amount: 0,
            notes: `Driver "${userName}" (ID: ${id}) was marked as deleted from the system`,
            timestamp: new Date(),
            createdAt: new Date()
          });
          
          console.log(`Added note to journey ${journey.id} about user deletion`);
        }
        
        return {
          success: true,
          message: `User ${id} (${userName}) marked as deleted. ${journeysToUpdate.length} journeys have been annotated.`,
          affectedJourneys: journeysToUpdate.length
        };
      });
    } catch (error) {
      console.error(`Error handling deletion of user ${id}:`, error);
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.licensePlate, licensePlate));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values({
      ...vehicle,
      status: vehicle.status ?? 'available' // Default to available if not specified
    }).returning();
    return newVehicle;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db.update(vehicles)
      .set(vehicleData)
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return true;
  }

  // Journey operations
  async getJourney(id: number): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, id));
    return journey;
  }

  async createJourney(journey: InsertJourney): Promise<Journey> {
    const [newJourney] = await db.insert(journeys).values({
      ...journey,
      status: 'active',
      origin: journey.origin ?? null,
      currentLatitude: null,
      currentLongitude: null,
      currentSpeed: null,
      estimatedFuelCost: null,
      estimatedArrivalTime: null,
      totalDistance: null
    }).returning();
    return newJourney;
  }

  async getAllJourneys(): Promise<Journey[]> {
    // Filter out archived journeys by default
    return await db.select()
      .from(journeys)
      .where(eq(journeys.archived, false))
      .orderBy(desc(journeys.startTime));
  }

  async getActiveJourneys(): Promise<Journey[]> {
    return await db.select()
      .from(journeys)
      .where(
        and(
          eq(journeys.status, 'active'),
          eq(journeys.archived, false)
        )
      )
      .orderBy(desc(journeys.startTime));
  }

  async getJourneysByUser(userId: number): Promise<Journey[]> {
    return await db.select()
      .from(journeys)
      .where(
        and(
          eq(journeys.userId, userId),
          eq(journeys.archived, false)
        )
      )
      .orderBy(desc(journeys.startTime));
  }

  async getJourneyByVehicle(licensePlate: string): Promise<Journey | undefined> {
    const [journey] = await db.select()
      .from(journeys)
      .where(
        and(
          eq(journeys.vehicleLicensePlate, licensePlate),
          eq(journeys.status, 'active'),
          eq(journeys.archived, false)
        )
      );
    return journey;
  }

  async updateJourney(id: number, journeyData: Partial<Journey>): Promise<Journey | undefined> {
    const [updatedJourney] = await db.update(journeys)
      .set(journeyData)
      .where(eq(journeys.id, id))
      .returning();
    return updatedJourney;
  }

  async endJourney(id: number): Promise<Journey | undefined> {
    const [endedJourney] = await db.update(journeys)
      .set({
        endTime: new Date(),
        status: 'completed'
      })
      .where(eq(journeys.id, id))
      .returning();
    return endedJourney;
  }

  // Expense operations
  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values({
      ...expense,
      notes: expense.notes ?? null
    }).returning();
    return newExpense;
  }

  async getExpensesByJourney(journeyId: number): Promise<Expense[]> {
    return await db.select()
      .from(expenses)
      .where(eq(expenses.journeyId, journeyId))
      .orderBy(desc(expenses.timestamp));
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const [updatedExpense] = await db.update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return true;
  }

  // Location operations
  async getLatestLocation(journeyId: number): Promise<LocationHistory | undefined> {
    const [location] = await db.select()
      .from(locationHistory)
      .where(eq(locationHistory.journeyId, journeyId))
      .orderBy(desc(locationHistory.timestamp))
      .limit(1);
    return location;
  }

  async createLocation(location: InsertLocation): Promise<LocationHistory> {
    const [newLocation] = await db.insert(locationHistory).values({
      ...location,
      speed: location.speed ?? null
    }).returning();
    return newLocation;
  }

  async getLocationHistoryByJourney(journeyId: number): Promise<LocationHistory[]> {
    return await db.select()
      .from(locationHistory)
      .where(eq(locationHistory.journeyId, journeyId))
      .orderBy(desc(locationHistory.timestamp));
  }

  // Milestone operations
  async getMilestone(id: number): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone;
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    // Stringify the data object if it exists and is not already a string
    const dataValue = milestone.data ? 
      (typeof milestone.data === 'string' ? milestone.data : JSON.stringify(milestone.data)) 
      : null;
      
    const [newMilestone] = await db.insert(milestones).values({
      journeyId: milestone.journeyId,
      type: milestone.type,
      title: milestone.title,
      message: milestone.message,
      isDismissed: milestone.isDismissed ?? false,
      data: dataValue
    }).returning();
    return newMilestone;
  }

  async getMilestonesByJourney(journeyId: number): Promise<Milestone[]> {
    return await db.select()
      .from(milestones)
      .where(eq(milestones.journeyId, journeyId))
      .orderBy(desc(milestones.createdAt));
  }

  async getActiveMilestonesByJourney(journeyId: number): Promise<Milestone[]> {
    return await db.select()
      .from(milestones)
      .where(
        and(
          eq(milestones.journeyId, journeyId),
          eq(milestones.isDismissed, false)
        )
      )
      .orderBy(desc(milestones.createdAt));
  }

  async dismissMilestone(id: number): Promise<Milestone | undefined> {
    const [updatedMilestone] = await db.update(milestones)
      .set({ isDismissed: true })
      .where(eq(milestones.id, id))
      .returning();
    return updatedMilestone;
  }

  // Journey Photo operations
  async getJourneyPhoto(id: number): Promise<JourneyPhoto | undefined> {
    const [photo] = await db.select().from(journeyPhotos).where(eq(journeyPhotos.id, id));
    return photo;
  }

  async createJourneyPhoto(photo: InsertJourneyPhoto): Promise<JourneyPhoto> {
    const [newPhoto] = await db.insert(journeyPhotos).values({
      ...photo,
      description: photo.description ?? null
    }).returning();
    return newPhoto;
  }

  async getJourneyPhotosByJourney(journeyId: number): Promise<JourneyPhoto[]> {
    return await db.select()
      .from(journeyPhotos)
      .where(eq(journeyPhotos.journeyId, journeyId))
      .orderBy(desc(journeyPhotos.timestamp));
  }
}

export const storage = new DatabaseStorage();