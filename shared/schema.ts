import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, foreignKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  userId: integer("user_id").notNull().references(() => users.id),
  vehicleLicensePlate: text("vehicle_license_plate").notNull().references(() => vehicles.licensePlate),
  origin: text("origin"),
  destination: text("destination").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("active"),
  pouch: integer("pouch").notNull(),
  initialExpense: integer("initial_expense").default(0),
  loading: integer("loading").default(0),
  rope: integer("rope").default(0),
  rto: integer("rto").default(0),
  hydUnloading: integer("hyd_unloading").default(0),
  nzbUnloading: integer("nzb_unloading").default(0),
  currentLatitude: doublePrecision("current_latitude"),
  currentLongitude: doublePrecision("current_longitude"),
  currentSpeed: doublePrecision("current_speed"),
  estimatedFuelCost: integer("estimated_fuel_cost"),
  estimatedArrivalTime: timestamp("estimated_arrival_time"),
  totalDistance: doublePrecision("total_distance"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archived: boolean("archived").default(false),
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
  journeyId: integer("journey_id").notNull().references(() => journeys.id),
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
  journeyId: integer("journey_id").notNull().references(() => journeys.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  speed: doublePrecision("speed"),
  distanceCovered: doublePrecision("distance_covered"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locationHistory).pick({
  journeyId: true,
  latitude: true,
  longitude: true,
  speed: true,
  distanceCovered: true,
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
  security: z.number().optional(),
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
  distanceCovered: z.number().optional(),
});

export type UpdateLocation = z.infer<typeof updateLocationSchema>;

// Milestone tracking
export const milestoneTypes = [
  'JOURNEY_START',
  'JOURNEY_END',
  'HALFWAY_POINT',
  'FUEL_STATION_NEARBY',
  'DESTINATION_NEAR',
  'EXPENSE_ALERT',
  'REST_REMINDER',
  'DISTANCE_MILESTONE'
] as const;

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<typeof milestoneTypes[number]>(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: json("data"),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const milestoneSchema = createInsertSchema(milestones);

// Create a more specific schema for insertion that includes the data field
export const insertMilestoneSchema = z.object({
  journeyId: z.number(),
  type: z.enum(milestoneTypes),
  title: z.string(),
  message: z.string(),
  data: z.any().optional(),
  isDismissed: z.boolean().default(false)
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  journeys: many(journeys),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  journeys: many(journeys, { relationName: "vehicle_journeys" }),
}));

export const journeysRelations = relations(journeys, ({ one, many }) => ({
  user: one(users, {
    fields: [journeys.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [journeys.vehicleLicensePlate],
    references: [vehicles.licensePlate],
    relationName: "vehicle_journeys"
  }),
  expenses: many(expenses),
  locations: many(locationHistory),
  milestones: many(milestones),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  journey: one(journeys, {
    fields: [expenses.journeyId],
    references: [journeys.id],
  }),
}));

export const locationHistoryRelations = relations(locationHistory, ({ one }) => ({
  journey: one(journeys, {
    fields: [locationHistory.journeyId],
    references: [journeys.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  journey: one(journeys, {
    fields: [milestones.journeyId],
    references: [journeys.id],
  }),
}));
