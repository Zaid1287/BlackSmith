import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import {
  insertJourneySchema,
  insertExpenseSchema,
  startJourneySchema,
  addExpenseSchema,
  updateLocationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Create HTTP server for WebSocket connections
  const httpServer = createServer(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is admin
  const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Admin access required" });
  };

  // Vehicle Routes
  app.get("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get vehicles" });
    }
  });

  app.post("/api/vehicles", isAdmin, async (req, res) => {
    try {
      const vehicle = await storage.createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Journey Routes
  app.post("/api/journeys/start", isAuthenticated, async (req, res) => {
    try {
      const journeyData = startJourneySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if user already has an active journey
      const userJourneys = await storage.getJourneysByUser(req.user.id);
      const hasActiveJourney = userJourneys.some(journey => journey.status === "active");
      
      if (hasActiveJourney) {
        return res.status(400).json({ message: "You already have an active journey" });
      }
      
      // Check if vehicle is already in use
      const vehicleJourney = await storage.getJourneyByVehicle(journeyData.vehicleLicensePlate);
      if (vehicleJourney) {
        return res.status(400).json({ message: "This vehicle is already in use" });
      }
      
      const journey = await storage.createJourney(journeyData);
      
      // Add the initial expense
      if (journeyData.initialExpense > 0) {
        await storage.createExpense({
          journeyId: journey.id,
          type: "Initial",
          amount: journeyData.initialExpense,
          notes: "Initial journey expense"
        });
      }
      
      res.status(201).json(journey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid journey data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to start journey" });
    }
  });

  app.get("/api/journeys", isAuthenticated, async (req, res) => {
    try {
      let journeys;
      
      // Admins can see all journeys, users can only see their own
      if (req.user.isAdmin) {
        journeys = await storage.getAllJourneys();
      } else {
        journeys = await storage.getJourneysByUser(req.user.id);
      }
      
      // For each journey, get the expenses
      const journeysWithExpenses = await Promise.all(
        journeys.map(async (journey) => {
          const expenses = await storage.getExpensesByJourney(journey.id);
          const latestLocation = await storage.getLatestLocation(journey.id);
          
          return {
            ...journey,
            expenses,
            latestLocation
          };
        })
      );
      
      res.json(journeysWithExpenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get journeys" });
    }
  });
  
  app.get("/api/journeys/active", isAuthenticated, async (req, res) => {
    try {
      let activeJourneys = await storage.getActiveJourneys();
      
      // If not admin, filter to just show the user's active journeys
      if (!req.user.isAdmin) {
        activeJourneys = activeJourneys.filter(journey => journey.userId === req.user.id);
      }
      
      // For each journey, get the expenses and latest location
      const journeysWithDetails = await Promise.all(
        activeJourneys.map(async (journey) => {
          const expenses = await storage.getExpensesByJourney(journey.id);
          const latestLocation = await storage.getLatestLocation(journey.id);
          const user = await storage.getUser(journey.userId);
          
          const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
          
          return {
            ...journey,
            userName: user ? user.name : "Unknown",
            totalExpenses,
            balance: journey.pouch - totalExpenses,
            latestLocation
          };
        })
      );
      
      res.json(journeysWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active journeys" });
    }
  });

  app.get("/api/journeys/:id", isAuthenticated, async (req, res) => {
    try {
      const journeyId = parseInt(req.params.id);
      if (isNaN(journeyId)) {
        return res.status(400).json({ message: "Invalid journey ID" });
      }
      
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      // Check if user has access to this journey
      if (!req.user.isAdmin && journey.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const expenses = await storage.getExpensesByJourney(journeyId);
      const locationHistory = await storage.getLocationHistoryByJourney(journeyId);
      
      res.json({
        ...journey,
        expenses,
        locationHistory
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get journey" });
    }
  });

  app.post("/api/journeys/:id/end", isAuthenticated, async (req, res) => {
    try {
      const journeyId = parseInt(req.params.id);
      if (isNaN(journeyId)) {
        return res.status(400).json({ message: "Invalid journey ID" });
      }
      
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      // Check if user has access to end this journey
      if (!req.user.isAdmin && journey.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedJourney = await storage.endJourney(journeyId);
      res.json(updatedJourney);
    } catch (error) {
      res.status(500).json({ message: "Failed to end journey" });
    }
  });

  // Expense Routes
  app.post("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const expenseData = addExpenseSchema.parse(req.body);
      
      // Check if journey exists
      const journey = await storage.getJourney(expenseData.journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      // Check if user has access to this journey
      if (!req.user.isAdmin && journey.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if journey is active
      if (journey.status !== "active") {
        return res.status(400).json({ message: "Cannot add expense to completed journey" });
      }
      
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add expense" });
    }
  });

  app.get("/api/journeys/:id/expenses", isAuthenticated, async (req, res) => {
    try {
      const journeyId = parseInt(req.params.id);
      if (isNaN(journeyId)) {
        return res.status(400).json({ message: "Invalid journey ID" });
      }
      
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      // Check if user has access to this journey
      if (!req.user.isAdmin && journey.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const expenses = await storage.getExpensesByJourney(journeyId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenses" });
    }
  });

  // Location Routes
  app.post("/api/location", isAuthenticated, async (req, res) => {
    try {
      const locationData = updateLocationSchema.parse(req.body);
      
      // Check if journey exists
      const journey = await storage.getJourney(locationData.journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      // Check if user has access to this journey
      if (!req.user.isAdmin && journey.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if journey is active
      if (journey.status !== "active") {
        return res.status(400).json({ message: "Cannot update location for completed journey" });
      }
      
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid location data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.get("/api/journeys/:id/location/latest", isAuthenticated, async (req, res) => {
    try {
      const journeyId = parseInt(req.params.id);
      if (isNaN(journeyId)) {
        return res.status(400).json({ message: "Invalid journey ID" });
      }
      
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).json({ message: "Journey not found" });
      }
      
      const latestLocation = await storage.getLatestLocation(journeyId);
      if (!latestLocation) {
        return res.status(404).json({ message: "No location data found" });
      }
      
      res.json(latestLocation);
    } catch (error) {
      res.status(500).json({ message: "Failed to get location" });
    }
  });

  return httpServer;
}
