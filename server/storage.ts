import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { 
  users, vehicles, journeys, expenses, locationHistory,
  type User, type InsertUser,
  type Vehicle, type InsertVehicle,
  type Journey, type InsertJourney,
  type Expense, type InsertExpense,
  type LocationHistory, type InsertLocation
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
    const result = await db.delete(users).where(eq(users.id, id));
    return true; // Drizzle doesn't return affected rows count
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
    return await db.select().from(journeys);
  }

  async getActiveJourneys(): Promise<Journey[]> {
    return await db.select()
      .from(journeys)
      .where(eq(journeys.status, 'active'))
      .orderBy(desc(journeys.startTime));
  }

  async getJourneysByUser(userId: number): Promise<Journey[]> {
    return await db.select()
      .from(journeys)
      .where(eq(journeys.userId, userId))
      .orderBy(desc(journeys.startTime));
  }

  async getJourneyByVehicle(licensePlate: string): Promise<Journey | undefined> {
    const [journey] = await db.select()
      .from(journeys)
      .where(
        and(
          eq(journeys.vehicleLicensePlate, licensePlate),
          eq(journeys.status, 'active')
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
}

export const storage = new DatabaseStorage();