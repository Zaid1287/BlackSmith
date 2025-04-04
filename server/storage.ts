import { users, vehicles, journeys, expenses, locationHistory } from "@shared/schema";
import type { 
  User, InsertUser, 
  Vehicle, InsertVehicle, 
  Journey, InsertJourney, 
  Expense, InsertExpense, 
  LocationHistory, InsertLocation 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private journeys: Map<number, Journey>;
  private expenses: Map<number, Expense>;
  private locations: Map<number, LocationHistory>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private vehicleIdCounter: number;
  private journeyIdCounter: number;
  private expenseIdCounter: number;
  private locationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.journeys = new Map();
    this.expenses = new Map();
    this.locations = new Map();
    
    this.userIdCounter = 1;
    this.vehicleIdCounter = 1;
    this.journeyIdCounter = 1;
    this.expenseIdCounter = 1;
    this.locationIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123", // Will be hashed during registration
      name: "Admin User",
      isAdmin: true
    });
    
    // Create default driver
    this.createUser({
      username: "driver",
      password: "driver123", // Will be hashed during registration
      name: "Test Driver",
      isAdmin: false
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const newUser: User = {
      id,
      ...user,
      createdAt: timestamp
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(vehicle => vehicle.licensePlate === licensePlate);
  }
  
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleIdCounter++;
    const timestamp = new Date();
    const newVehicle: Vehicle = {
      id,
      ...vehicle,
      createdAt: timestamp
    };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }
  
  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }
  
  async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle = { ...vehicle, ...vehicleData };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }
  
  // Journey operations
  async getJourney(id: number): Promise<Journey | undefined> {
    return this.journeys.get(id);
  }
  
  async createJourney(journey: InsertJourney): Promise<Journey> {
    const id = this.journeyIdCounter++;
    const timestamp = new Date();
    const newJourney: Journey = {
      id,
      ...journey,
      startTime: timestamp,
      status: "active",
      endTime: null,
      currentLatitude: null,
      currentLongitude: null,
      currentSpeed: null,
      estimatedFuelCost: null,
      estimatedArrivalTime: null,
      totalDistance: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.journeys.set(id, newJourney);
    
    // Check if vehicle exists, if not, create it
    const existingVehicle = await this.getVehicleByLicensePlate(journey.vehicleLicensePlate);
    if (!existingVehicle) {
      await this.createVehicle({
        licensePlate: journey.vehicleLicensePlate,
        status: "in-use"
      });
    }
    
    return newJourney;
  }
  
  async getAllJourneys(): Promise<Journey[]> {
    return Array.from(this.journeys.values());
  }
  
  async getActiveJourneys(): Promise<Journey[]> {
    return Array.from(this.journeys.values()).filter(journey => journey.status === "active");
  }
  
  async getJourneysByUser(userId: number): Promise<Journey[]> {
    return Array.from(this.journeys.values()).filter(journey => journey.userId === userId);
  }
  
  async getJourneyByVehicle(licensePlate: string): Promise<Journey | undefined> {
    return Array.from(this.journeys.values()).find(
      journey => journey.vehicleLicensePlate === licensePlate && journey.status === "active"
    );
  }
  
  async updateJourney(id: number, journeyData: Partial<Journey>): Promise<Journey | undefined> {
    const journey = this.journeys.get(id);
    if (!journey) return undefined;
    
    const now = new Date();
    const updatedJourney = { 
      ...journey, 
      ...journeyData,
      updatedAt: now
    };
    this.journeys.set(id, updatedJourney);
    return updatedJourney;
  }
  
  async endJourney(id: number): Promise<Journey | undefined> {
    const journey = this.journeys.get(id);
    if (!journey) return undefined;
    
    const now = new Date();
    const updatedJourney = { 
      ...journey, 
      status: "completed",
      endTime: now,
      updatedAt: now
    };
    this.journeys.set(id, updatedJourney);
    
    // Update vehicle status
    const vehicle = await this.getVehicleByLicensePlate(journey.vehicleLicensePlate);
    if (vehicle) {
      await this.updateVehicle(vehicle.id, { status: "available" });
    }
    
    return updatedJourney;
  }
  
  // Expense operations
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }
  
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    const timestamp = new Date();
    const newExpense: Expense = {
      id,
      ...expense,
      timestamp,
      createdAt: timestamp
    };
    this.expenses.set(id, newExpense);
    return newExpense;
  }
  
  async getExpensesByJourney(journeyId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.journeyId === journeyId);
  }
  
  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...expenseData };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }
  
  // Location operations
  async getLatestLocation(journeyId: number): Promise<LocationHistory | undefined> {
    const journeyLocations = await this.getLocationHistoryByJourney(journeyId);
    if (journeyLocations.length === 0) return undefined;
    
    return journeyLocations.reduce((latest, current) => {
      return latest.timestamp > current.timestamp ? latest : current;
    });
  }
  
  async createLocation(location: InsertLocation): Promise<LocationHistory> {
    const id = this.locationIdCounter++;
    const timestamp = new Date();
    const newLocation: LocationHistory = {
      id,
      ...location,
      timestamp
    };
    this.locations.set(id, newLocation);
    
    // Also update the current journey's location
    const journey = this.journeys.get(location.journeyId);
    if (journey) {
      this.updateJourney(journey.id, {
        currentLatitude: location.latitude,
        currentLongitude: location.longitude,
        currentSpeed: location.speed || 0,
      });
    }
    
    return newLocation;
  }
  
  async getLocationHistoryByJourney(journeyId: number): Promise<LocationHistory[]> {
    return Array.from(this.locations.values())
      .filter(location => location.journeyId === journeyId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
