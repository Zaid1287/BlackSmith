import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { User } from "@shared/schema";
import { 
  createJourneyStartMilestone, 
  createJourneyEndMilestone,
  createExpenseAlertMilestone,
  checkAndCreateDistanceMilestones,
  createRestReminderMilestone
} from "./milestone-service";

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
  
  // Reset financial data - Admin only
  app.post("/api/reset-financial-data", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      // 1. Get all completed journeys
      const journeys = await storage.getAllJourneys();
      const completedJourneys = journeys.filter(journey => journey.status === 'completed');
      
      // 2. Archive all completed journeys (set archive flag)
      for (const journey of completedJourneys) {
        // Cast to any to avoid TypeScript errors with the new archived field
        await storage.updateJourney(journey.id, { 
          ...journey,
          archived: true 
        } as any);
      }
      
      res.status(200).json({ message: "Financial data reset successfully" });
    } catch (error) {
      console.error("Error resetting financial data:", error);
      res.status(500).send("Error resetting financial data");
    }
  });

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

  // Delete user - Admin only
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow deleting current user
      if (userId === (req.user as any).id) {
        return res.status(400).send("Cannot delete current user");
      }
      
      // Don't allow deleting admins
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).send("User not found");
      }
      
      if (userToDelete.isAdmin) {
        return res.status(400).send("Cannot delete admin users");
      }
      
      const result = await storage.deleteUser(userId);
      res.json({ success: result });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).send("Error deleting user");
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
  
  // Add new vehicle - Admin only
  app.post("/api/vehicles", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const { licensePlate, model } = req.body;
      
      // Check if vehicle already exists
      const existingVehicle = await storage.getVehicleByLicensePlate(licensePlate);
      if (existingVehicle) {
        return res.status(400).send("Vehicle with this license plate already exists");
      }
      
      // Create new vehicle
      const vehicle = await storage.createVehicle({
        licensePlate,
        model,
        status: 'available'
      });
      
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).send("Error creating vehicle");
    }
  });
  
  // Get available vehicles - For all authenticated users
  app.get("/api/vehicles/available", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const allVehicles = await storage.getAllVehicles();
      // Filter only available vehicles
      const availableVehicles = allVehicles.filter(vehicle => vehicle.status === 'available');
      res.json(availableVehicles);
    } catch (error) {
      console.error("Error fetching available vehicles:", error);
      res.status(500).send("Error fetching available vehicles");
    }
  });
  
  // Delete vehicle - Admin only
  app.delete("/api/vehicles/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const vehicleId = parseInt(req.params.id);
      
      // Check if vehicle exists
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).send("Vehicle not found");
      }
      
      // Don't allow deleting vehicles in use
      if (vehicle.status !== 'available') {
        return res.status(400).send("Cannot delete vehicle that is in use");
      }
      
      const result = await storage.deleteVehicle(vehicleId);
      res.json({ success: result });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).send("Error deleting vehicle");
    }
  });

  // Get active journeys - Admin only
  app.get("/api/journeys/active", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const activeJourneys = await storage.getActiveJourneys();
      
      // Get user details and expenses for each journey
      const journeysWithDetails = await Promise.all(
        activeJourneys.map(async (journey) => {
          const user = await storage.getUser(journey.userId);
          const expenses = await storage.getExpensesByJourney(journey.id);
          const latestLocation = await storage.getLatestLocation(journey.id);
          
          const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
          // Add initial expense (security) to the balance when journey is completed
          const securityAdjustment = journey.status === 'completed' ? (journey.initialExpense || 0) : 0;
          const balance = journey.pouch - totalExpenses + securityAdjustment;
          
          return {
            ...journey,
            userName: user?.name || "Unknown",
            totalExpenses,
            balance,
            latestLocation
          };
        })
      );
      
      res.json(journeysWithDetails);
    } catch (error) {
      console.error("Error fetching active journeys:", error);
      res.status(500).send("Error fetching active journeys");
    }
  });
  
  // Get new journeys that need admin attention (pouch not set or recently started)
  app.get("/api/journeys/new", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const activeJourneys = await storage.getActiveJourneys();
      
      // Filter for journeys that need admin attention
      // These are journeys that either have no pouch amount set or were started in the last hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const newJourneys = await Promise.all(
        activeJourneys
          .filter(journey => 
            journey.pouch === 0 || // Pouch amount not set
            (journey.startTime > oneHourAgo) // Started in the last hour
          )
          .map(async (journey) => {
            const user = await storage.getUser(journey.userId);
            return {
              ...journey,
              userName: user?.name || "Unknown"
            };
          })
      );
      
      res.json(newJourneys);
    } catch (error) {
      console.error("Error fetching new journeys:", error);
      res.status(500).send("Failed to fetch new journeys");
    }
  });
  
  // Update journey pouch amount (admin only)
  app.post("/api/journey/:id/update-pouch", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      const { pouch } = req.body;
      
      if (!pouch || isNaN(pouch) || pouch <= 0) {
        return res.status(400).send("Valid pouch amount is required");
      }
      
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const updatedJourney = await storage.updateJourney(journeyId, { pouch });
      res.json(updatedJourney);
    } catch (error) {
      console.error("Error updating journey pouch:", error);
      res.status(500).send("Failed to update journey pouch");
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
      // Map the security field to initialExpense in the database
      const { security, ...restBody } = req.body;
      const journeyData = {
        ...restBody,
        initialExpense: security || 0,
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
      
      // Create journey start milestone
      await createJourneyStartMilestone(journey);
      
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
      
      // If this is a Top Up, we no longer update the pouch amount
      // Instead, we keep the pouch as the initial value and top-ups are tracked separately
      if (req.body.type === 'topUp') {
        console.log(`Journey ${journeyId} received a top-up of ${req.body.amount}, pouch remains at ${journey.pouch}`);
        // No update to the journey's pouch amount
      } else {
        // Only create expense alert milestone for actual expenses, not for top-ups
        await createExpenseAlertMilestone(journey, expense.amount);
      }
      
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
        speed: req.body.speed,
        distanceCovered: req.body.distanceCovered
      });
      
      // Update current location in journey
      await storage.updateJourney(journeyId, {
        currentLatitude: req.body.latitude,
        currentLongitude: req.body.longitude,
        currentSpeed: req.body.speed,
        updatedAt: new Date()
      });
      
      // Check if we need to create any milestones based on this location update
      await checkAndCreateDistanceMilestones(journey, location);
      
      // Check if we need to create a rest reminder
      await createRestReminderMilestone(journey);
      
      res.status(201).json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).send("Error updating location");
    }
  });

  // End a journey
  app.post("/api/journey/:id/end", async (req: Request, res: Response) => {
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
        return res.status(403).send("Not authorized to end this journey");
      }
      
      // End the journey
      const updatedJourney = await storage.endJourney(journeyId);
      
      // Create journey end milestone only if journey was found and ended
      if (updatedJourney) {
        // Add the security amount (initialExpense) back to the journey summary in the UI
        // The getJourneys endpoint will include this adjustment
        await createJourneyEndMilestone(updatedJourney);
        
        // Log the return of security deposit
        console.log(`Journey ${journeyId} completed. Security deposit of ${updatedJourney.initialExpense} will be returned.`);
      }
      
      res.status(200).json(updatedJourney);
    } catch (error) {
      console.error("Error ending journey:", error);
      res.status(500).send("Error ending journey");
    }
  });

  // Get all journeys - accessible to all authenticated users
  app.get("/api/journeys", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const isAdmin = (req.user as any).isAdmin;
      const userId = (req.user as any).id;
      
      // Admins can see all journeys, regular users can only see their own
      let journeys;
      if (isAdmin) {
        journeys = await storage.getAllJourneys();
      } else {
        journeys = await storage.getJourneysByUser(userId);
      }
      
      // Add extra details that might be needed for the UI
      const enhancedJourneys = await Promise.all(journeys.map(async (journey) => {
        const expenses = await storage.getExpensesByJourney(journey.id);
        
        // Separate different types of expenses
        const topUpExpenses = expenses.filter(expense => expense.type === 'topUp');
        const hydInwardExpenses = expenses.filter(expense => expense.type === 'hydInward');
        // Regular expenses exclude both top-ups and HYD Inward
        const regularExpenses = expenses.filter(expense => 
          expense.type !== 'topUp' && expense.type !== 'hydInward'
        );
        
        const totalExpenses = regularExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalTopUps = topUpExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalHydInward = hydInwardExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        const latestLocation = await storage.getLatestLocation(journey.id);
        
        // Add initial expense (security) to the balance when journey is completed
        const securityAdjustment = journey.status === 'completed' ? (journey.initialExpense || 0) : 0;
        
        // Working Balance = Pouch + TopUps - Regular Expenses
        const workingBalance = journey.pouch + totalTopUps - totalExpenses;
        
        // Final Balance = Working Balance + Security (if completed) + HYD Inward (if completed)
        const finalBalance = workingBalance + securityAdjustment + 
                            (journey.status === 'completed' ? totalHydInward : 0);
        
        return {
          ...journey,
          userName: (await storage.getUser(journey.userId))?.name || 'Unknown',
          totalExpenses,
          totalTopUps,
          totalHydInward,
          workingBalance,
          // Use the final balance as the balance property for backwards compatibility
          balance: finalBalance,
          latestLocation,
        };
      }));
      
      res.json(enhancedJourneys);
    } catch (error) {
      console.error("Error fetching journeys:", error);
      res.status(500).send("Error fetching journeys");
    }
  });

  // Get a single journey with complete details
  app.get("/api/journey/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      // Check if journey exists
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can see journey details
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to view this journey");
      }
      
      // Fetch all related data
      const expenses = await storage.getExpensesByJourney(journeyId);
      const locationHistory = await storage.getLocationHistoryByJourney(journeyId);
      const user = await storage.getUser(journey.userId);
      
      // Calculate financial metrics
      // Separate different types of expenses
      const topUpExpenses = expenses.filter(expense => expense.type === 'topUp');
      const hydInwardExpenses = expenses.filter(expense => expense.type === 'hydInward');
      // Regular expenses exclude both top-ups and HYD Inward
      const regularExpenses = expenses.filter(expense => 
        expense.type !== 'topUp' && expense.type !== 'hydInward'
      );
      
      const totalExpenses = regularExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalTopUps = topUpExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalHydInward = hydInwardExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Add security deposit to balance when journey is completed
      const securityAdjustment = journey.status === 'completed' ? (journey.initialExpense || 0) : 0;
      
      // Working Balance = Pouch + TopUps - Regular Expenses
      const workingBalance = journey.pouch + totalTopUps - totalExpenses;
      
      // Final Balance = Working Balance + Security (if completed) + HYD Inward (if completed)
      const finalBalance = workingBalance + securityAdjustment + 
                          (journey.status === 'completed' ? totalHydInward : 0);
      
      // Create enhanced journey object with all details
      const enhancedJourney = {
        ...journey,
        expenses,
        locationHistory,
        userName: user?.name || 'Unknown',
        totalExpenses,
        totalTopUps,
        totalHydInward,
        workingBalance,
        // Use the final balance as the balance property for backwards compatibility
        balance: finalBalance,
        securityAdjustment,
        // Include formatted dates for easier display
        startTimeFormatted: journey.startTime ? new Date(journey.startTime).toLocaleString() : null,
        endTimeFormatted: journey.endTime ? new Date(journey.endTime).toLocaleString() : null
      };
      
      res.json(enhancedJourney);
    } catch (error) {
      console.error("Error fetching journey details:", error);
      res.status(500).send("Error fetching journey details");
    }
  });

  // Get journey expenses
  app.get("/api/journey/:id/expense", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      // Check if journey exists
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can see expenses
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to view this journey's expenses");
      }
      
      const expenses = await storage.getExpensesByJourney(journeyId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).send("Error fetching expenses");
    }
  });

  // Milestone routes
  app.get("/api/journey/:id/milestones", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      // Check if journey exists
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can see milestones
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to view this journey's milestones");
      }
      
      const milestones = await storage.getMilestonesByJourney(journeyId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).send("Error fetching milestones");
    }
  });
  
  app.get("/api/journey/:id/milestones/active", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      // Check if journey exists
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can see milestones
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to view this journey's milestones");
      }
      
      const milestones = await storage.getActiveMilestonesByJourney(journeyId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching active milestones:", error);
      res.status(500).send("Error fetching active milestones");
    }
  });
  
  app.post("/api/journey/:id/milestone", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      // Check if journey exists
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can add milestones
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to add milestones to this journey");
      }
      
      // Validate the milestone data
      const milestoneData = {
        ...req.body,
        journeyId,
        isDismissed: false
      };
      
      const milestone = await storage.createMilestone(milestoneData);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).send("Error creating milestone");
    }
  });
  
  app.post("/api/milestone/:id/dismiss", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const milestoneId = parseInt(req.params.id);
      
      if (isNaN(milestoneId)) {
        return res.status(400).send("Invalid milestone ID");
      }
      
      // Get the milestone to verify authorization
      const milestone = await storage.getMilestone(milestoneId);
      if (!milestone) {
        return res.status(404).send("Milestone not found");
      }
      
      // Get the journey to check ownership
      const journey = await storage.getJourney(milestone.journeyId);
      if (!journey) {
        return res.status(404).send("Associated journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can dismiss milestones
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to dismiss this milestone");
      }
      
      const updatedMilestone = await storage.dismissMilestone(milestoneId);
      res.json(updatedMilestone);
    } catch (error) {
      console.error("Error dismissing milestone:", error);
      res.status(500).send("Error dismissing milestone");
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}