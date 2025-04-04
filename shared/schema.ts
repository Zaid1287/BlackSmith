import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  isAdmin: true,
});

// Vehicle model
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  licensePlate: text("license_plate").notNull().unique(),
  model: text("model"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  licensePlate: true,
  model: true,
  status: true,
});

// Journey model
export const journeys = pgTable("journeys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vehicleLicensePlate: text("vehicle_license_plate").notNull(),
  origin: text("origin"),
  destination: text("destination").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("active"),
  pouch: integer("pouch").notNull(),
  initialExpense: integer("initial_expense").notNull(),
  loading: integer("loading").notNull(),
  rope: integer("rope").notNull(),
  rto: integer("rto").notNull(),
  hydUnloading: integer("hyd_unloading").notNull(),
  nzbUnloading: integer("nzb_unloading").notNull(),
  currentLatitude: doublePrecision("current_latitude"),
  currentLongitude: doublePrecision("current_longitude"),
  currentSpeed: doublePrecision("current_speed"),
  estimatedFuelCost: integer("estimated_fuel_cost"),
  estimatedArrivalTime: timestamp("estimated_arrival_time"),
  totalDistance: doublePrecision("total_distance"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJourneySchema = createInsertSchema(journeys)
  .omit({
    id: true,
    startTime: true,
    endTime: true,
    status: true,
    currentLatitude: true,
    currentLongitude: true,
    currentSpeed: true,
    estimatedFuelCost: true,
    estimatedArrivalTime: true,
    totalDistance: true,
    createdAt: true,
    updatedAt: true,
  });

// Expense model
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  journeyId: true,
  type: true,
  amount: true,
  notes: true,
});

// Location history model
export const locationHistory = pgTable("location_history", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  speed: doublePrecision("speed"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locationHistory).pick({
  journeyId: true,
  latitude: true,
  longitude: true,
  speed: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Journey = typeof journeys.$inferSelect;
export type InsertJourney = z.infer<typeof insertJourneySchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type LocationHistory = typeof locationHistory.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

// Extended schema for client-side journey start
export const startJourneySchema = z.object({
  userId: z.number(),
  vehicleLicensePlate: z.string().min(3, "License plate is required"),
  destination: z.string().min(3, "Destination is required"),
  pouch: z.number().min(1, "Pouch amount is required"),
  initialExpense: z.number().min(0, "Initial expense is required"),
  loading: z.number().min(0, "Loading expense is required"),
  rope: z.number().min(0, "Rope expense is required"),
  rto: z.number().min(0, "RTO expense is required"),
  hydUnloading: z.number().min(0, "HYD unloading expense is required"),
  nzbUnloading: z.number().min(0, "NZB unloading expense is required"),
  origin: z.string().optional(),
});

export type StartJourney = z.infer<typeof startJourneySchema>;

// Extended schema for adding expenses
export const addExpenseSchema = z.object({
  journeyId: z.number(),
  type: z.string().min(1, "Expense type is required"),
  amount: z.number().min(1, "Amount is required"),
  notes: z.string().optional(),
});

export type AddExpense = z.infer<typeof addExpenseSchema>;

// Extended schema for updating location
export const updateLocationSchema = z.object({
  journeyId: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional(),
});

export type UpdateLocation = z.infer<typeof updateLocationSchema>;
