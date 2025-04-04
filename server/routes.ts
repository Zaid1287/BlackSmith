import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { User } from "@shared/schema";

// Extend Express Request to include user property
declare module "express" {
  interface User {
    id: number;
    username: string;
    password: string;
    name: string;
    isAdmin: boolean;
    createdAt: Date;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get all users - Admin only
  app.get("/api/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Error fetching users");
    }
  });

  // Get all vehicles - Admin only
  app.get("/api/vehicles", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).send("Error fetching vehicles");
    }
  });

  // Get active journeys - Admin only
  app.get("/api/journeys/active", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const journeys = await storage.getActiveJourneys();
      res.json(journeys);
    } catch (error) {
      console.error("Error fetching active journeys:", error);
      res.status(500).send("Error fetching active journeys");
    }
  });

  // Get journeys for current user
  app.get("/api/user/journeys", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const userId = (req.user as any).id;
      const journeys = await storage.getJourneysByUser(userId);
      res.json(journeys);
    } catch (error) {
      console.error("Error fetching user journeys:", error);
      res.status(500).send("Error fetching user journeys");
    }
  });

  // Start a new journey
  app.post("/api/journey/start", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyData = {
        ...req.body,
        userId: (req.user as any).id
      };
      
      // Check if vehicle exists
      const vehicle = await storage.getVehicleByLicensePlate(journeyData.vehicleLicensePlate);
      if (!vehicle) {
        return res.status(404).send("Vehicle not found");
      }
      
      // Check if vehicle is already in use
      const activeJourney = await storage.getJourneyByVehicle(journeyData.vehicleLicensePlate);
      if (activeJourney) {
        return res.status(400).send("Vehicle is already in use");
      }
      
      // Create new journey
      const journey = await storage.createJourney(journeyData);
      res.status(201).json(journey);
    } catch (error) {
      console.error("Error starting journey:", error);
      res.status(500).send("Error starting journey");
    }
  });

  // Add expense to journey
  app.post("/api/journey/:id/expense", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      // Check if journey exists and belongs to user
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to add expenses to this journey");
      }
      
      // Create the expense
      const expense = await storage.createExpense({
        ...req.body,
        journeyId
      });
      
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error adding expense:", error);
      res.status(500).send("Error adding expense");
    }
  });

  // Update journey location
  app.post("/api/journey/:id/location", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      // Check if journey exists and belongs to user
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to update this journey");
      }
      
      // Create location history entry
      const location = await storage.createLocation({
        journeyId,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        speed: req.body.speed
      });
      
      // Update current location in journey
      await storage.updateJourney(journeyId, {
        currentLatitude: req.body.latitude,
        currentLongitude: req.body.longitude,
        currentSpeed: req.body.speed,
        updatedAt: new Date()
      });
      
      res.status(201).json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).send("Error updating location");
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}