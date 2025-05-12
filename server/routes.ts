import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { User } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import { 
  createJourneyStartMilestone, 
  createJourneyEndMilestone,
  createExpenseAlertMilestone,
  checkAndCreateDistanceMilestones,
  createRestReminderMilestone
} from "./milestone-service";

// Import schema tables directly
import { users, journeys } from "@shared/schema";

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

export async function registerRoutes(app: Express, options = { skipAuth: false }): Promise<Server> {
  // Serve privacy policy directly (important for Play Store submissions)
  app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client/public/privacy-policy.html'));
  });
  // Set up authentication routes (unless we're skipping because they're handled elsewhere)
  if (!options.skipAuth) {
    setupAuth(app);
  }
  
  // Reset financial data - Admin only
  app.post("/api/reset-financial-data", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    
    try {
      console.log("Starting financial data reset process...");
      
      // 1. Get all completed journeys (including those not filtered by getAllJourneys)
      const { db } = await import("./db");
      const { journeys } = await import("@shared/schema");
      
      const allJourneys = await db.select().from(journeys);
      const completedJourneys = allJourneys.filter((journey: any) => 
        journey.status === 'completed' && journey.archived === false);
      
      console.log(`Found ${completedJourneys.length} completed journeys to archive`);
      
      // 2. Archive all completed journeys (set archive flag)
      for (const journey of completedJourneys) {
        console.log(`Archiving journey ID: ${journey.id}`);
        
        try {
          await storage.updateJourney(journey.id, { 
            archived: true 
          });
        } catch (updateError) {
          console.error(`Failed to archive journey ${journey.id}:`, updateError);
        }
      }
      
      console.log("Financial data reset successful");
      res.status(200).json({ message: "Financial data reset successfully", archivedCount: completedJourneys.length });
    } catch (error: any) {
      console.error("Error resetting financial data:", error);
      res.status(500).json({ 
        error: "Error resetting financial data", 
        message: error.message || "Unknown error occurred"
      });
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
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account"
        });
      }
      
      // Don't allow deleting admins
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      if (userToDelete.isAdmin) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete admin users"
        });
      }
      
      // Always use the force delete method to handle journeys properly
      // This will set userId to null for any associated journeys and add a system note
      const result = await storage.forceDeleteUserWithJourneys(userId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: error.message || "An unexpected error occurred while deleting the user"
      });
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
          const photos = await storage.getJourneyPhotosByJourney(journey.id);
          
          const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
          // Add initial expense (security) to the balance when journey is completed
          const securityAdjustment = journey.status === 'completed' ? (journey.initialExpense || 0) : 0;
          const balance = journey.pouch - totalExpenses + securityAdjustment;
          
          // Handle displaying user name, including for deleted users
          let userName = "Unknown";
          if (user) {
            userName = user.name.startsWith("DELETED:") ? 
              user.name.replace("DELETED:", "Deleted User:") : user.name;
          }
          
          return {
            ...journey,
            userName,
            totalExpenses,
            balance,
            latestLocation,
            photos
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
            let userName = "Unknown";
            
            if (user) {
              // Check if it's a deleted user
              userName = user.name.startsWith("DELETED:") ? user.name.replace("DELETED:", "Deleted User:") : user.name;
            }
            
            return {
              ...journey,
              userName
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
      const { security, journeyPhoto, photoDescription, ...restBody } = req.body;
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
      
      // Save journey photo if provided
      if (journeyPhoto) {
        await storage.createJourneyPhoto({
          journeyId: journey.id,
          imageData: journeyPhoto,
          description: photoDescription || 'Journey start photo'
        });
        console.log(`Photo added to journey ${journey.id}`);
      }
      
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
        
        // Calculate journey balance for this journey
        const expenses = await storage.getExpensesByJourney(journeyId);
        const topUpExpenses = expenses.filter(expense => expense.type === 'topUp');
        const regularExpenses = expenses.filter(expense => 
          expense.type !== 'topUp' && expense.type !== 'hydInward'
        );
        
        const totalRegularExpenses = regularExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalTopUps = topUpExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Working Balance = Pouch + TopUps - Regular Expenses
        const workingBalance = updatedJourney.pouch + totalTopUps - totalRegularExpenses;
        
        // Update the user's salary - get the current salary record
        if (updatedJourney.userId) {
          const salaryRecord = await storage.getUserSalary(updatedJourney.userId);
          
          if (salaryRecord) {
            let amountToUpdate = 0;
            
            // Check if working balance is negative
            if (workingBalance < 0) {
              // If negative, add the pouch amount to the working balance
              // This is like recognizing that the driver used some of the pouch money
              // for expenses that weren't properly accounted for
              amountToUpdate = Math.abs(workingBalance);
              
              console.log(`Journey ${journeyId} ended with negative working balance: ${workingBalance}`);
              console.log(`Adding ${amountToUpdate} to driver's 'paid' amount for accounting purposes`);
            } else {
              // For positive working balance, no need to update the salary
              // The driver returned all the money correctly
              console.log(`Journey ${journeyId} ended with positive working balance: ${workingBalance}`);
              console.log(`No adjustment needed to driver's 'paid' amount`);
              amountToUpdate = 0;
            }
            
            // Only update salary if there's an amount to update (negative working balance)
            if (!isNaN(amountToUpdate) && amountToUpdate > 0) {
              // Add this amount to the existing paid amount 
              await storage.updateUserSalary(updatedJourney.userId, {
                paidAmount: salaryRecord.paidAmount + amountToUpdate,
                lastUpdated: new Date()
              });
              
              // Also create a salary history entry for tracking purposes
              await storage.createSalaryHistory({
                userId: updatedJourney.userId,
                amount: amountToUpdate,
                type: 'journey_adjustment', // Special type for journey negative balance adjustments
                description: `Adjustment for negative working balance on journey to ${updatedJourney.destination} (ID: ${updatedJourney.id})`
              });
              
              console.log(`Updated salary for user ${updatedJourney.userId}. Added ${amountToUpdate} to paid amount. New total: ${salaryRecord.paidAmount + amountToUpdate}`);
            } else {
              console.log(`No salary update needed for user ${updatedJourney.userId} as working balance is positive or zero.`);
            }
          } else {
            console.log(`No salary record found for user ${updatedJourney.userId}`);
          }
        }
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
        
        // Handle displaying user name, including for deleted users
        const user = await storage.getUser(journey.userId);
        let userName = "Unknown";
        if (user) {
          userName = user.name.startsWith("DELETED:") ? 
            user.name.replace("DELETED:", "Deleted User:") : user.name;
        }
        
        return {
          ...journey,
          userName,
          totalExpenses,
          totalTopUps,
          totalHydInward,
          workingBalance,
          // Use the final balance as the balance property for backwards compatibility
          balance: finalBalance,
          latestLocation,
          expenses, // Add full expenses array for HYD Inward calculations
          securityAdjustment, // Include the securityAdjustment explicitly
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
      const photos = await storage.getJourneyPhotosByJourney(journeyId);
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
      
      // Handle displaying user name, including for deleted users
      let userName = "Unknown";
      if (user) {
        userName = user.name.startsWith("DELETED:") ? 
          user.name.replace("DELETED:", "Deleted User:") : user.name;
      }
      
      // Create enhanced journey object with all details
      const enhancedJourney = {
        ...journey,
        expenses,
        locationHistory,
        photos,
        userName,
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

  // Get photos for a journey
  app.get("/api/journey/:id/photos", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      if (isNaN(journeyId)) {
        return res.status(400).send("Invalid journey ID");
      }
      
      // Check if journey exists
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can view photos
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to view photos for this journey");
      }
      
      // Get photos
      const photos = await storage.getJourneyPhotosByJourney(journeyId);
      
      res.json(photos);
    } catch (error) {
      console.error("Error fetching journey photos:", error);
      res.status(500).send("Error fetching journey photos");
    }
  });
  
  // Add a photo to a journey
  app.post("/api/journey/:id/photo", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    try {
      const journeyId = parseInt(req.params.id);
      
      if (isNaN(journeyId)) {
        return res.status(400).send("Invalid journey ID");
      }
      
      // Check if journey exists
      const journey = await storage.getJourney(journeyId);
      if (!journey) {
        return res.status(404).send("Journey not found");
      }
      
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).isAdmin;
      
      // Only journey's driver or admin can add photos
      if (journey.userId !== userId && !isAdmin) {
        return res.status(403).send("Not authorized to add photos to this journey");
      }
      
      const { imageData, description } = req.body;
      
      if (!imageData) {
        return res.status(400).send("Image data is required");
      }
      
      // Create photo
      const photo = await storage.createJourneyPhoto({
        journeyId,
        imageData,
        description: description || null
      });
      
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error adding photo to journey:", error);
      res.status(500).send("Error adding photo to journey");
    }
  });

  // Salary management routes
  
  // Get salary data for all users (admin only)
  app.get("/api/salaries", async (req: Request, res: Response) => {
    try {
      // Only admin users can see all salaries
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Get all users
      const users = await storage.getAllUsers();
      
      // Get all salaries
      const salaries = await storage.getAllSalaries();
      
      // Map salaries to users (excluding admin users)
      const userData = await Promise.all(users
        .filter(user => !user.isAdmin) // Filter out admin users
        .map(async (user) => {
          // Find salary for this user
          const salary = salaries.find(s => s.userId === user.id);
          
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            salaryAmount: salary?.salaryAmount || 0,
            paidAmount: salary?.paidAmount || 0,
            lastUpdated: salary?.lastUpdated || null
          };
        }));
      
      res.status(200).json(userData);
    } catch (error) {
      console.error("Error fetching salaries:", error);
      res.status(500).json({ error: "Failed to fetch salary data" });
    }
  });
  
  // Get salary for a specific user
  app.get("/api/user/:id/salary", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Only admin users can see other users' salaries
      if (!req.user.isAdmin && req.user.id !== userId) {
        return res.status(403).json({ error: "Not authorized to view this user's salary" });
      }
      
      const salary = await storage.getUserSalary(userId);
      
      // If no salary record exists, return zeros
      if (!salary) {
        return res.status(200).json({
          userId,
          salaryAmount: 0,
          paidAmount: 0,
          lastUpdated: null
        });
      }
      
      res.status(200).json(salary);
    } catch (error) {
      console.error(`Error fetching salary for user ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch salary data" });
    }
  });
  
  // Update salary for a specific user (admin only)
  app.post("/api/user/:id/salary", async (req: Request, res: Response) => {
    try {
      // Only admin users can update salaries
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Validate request body
      const { salaryAmount, paidAmount, paymentEntries, isPayout } = req.body;
      
      if (typeof salaryAmount !== 'number' || typeof paidAmount !== 'number') {
        return res.status(400).json({ error: "Salary and paid amount must be numbers" });
      }
      
      // Handle payout flag (used when Pay button is clicked)
      const isFullPayout = isPayout === true;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get existing salary record (if any)
      const existingSalary = await storage.getUserSalary(userId);
      
      // Calculate the new paid amount - if adding to existing amount
      const newPaidAmount = existingSalary ? 
        paidAmount : // Use the provided amount directly (client already calculated total)
        paidAmount;  // No existing record, use provided amount
      
      console.log(`Updating salary for user ${userId}. Salary: ${salaryAmount}, Paid: ${newPaidAmount}`);
      
      // Update salary
      const updatedSalary = await storage.updateUserSalary(userId, {
        salaryAmount,
        paidAmount: newPaidAmount,
        lastUpdated: new Date()
      });
      
      // If this is a full payout (Pay button was clicked), update the financial data
      // by deducting the salary amount from Net Profit
      if (isFullPayout && existingSalary && existingSalary.paidAmount > 0) {
        console.log(`Processing full salary payout for user ${userId}. Amount: ${existingSalary.paidAmount}`);
        
        // We need to deduct this amount from overall net profit - even if there's no active journey
        // Find the first journey (completed or active) to attach the salary expense to
        try {
          // Get all journeys to find one to attach the expense to
          const allJourneys = await storage.getAllJourneys();
          
          if (allJourneys && allJourneys.length > 0) {
            // Sort journeys by most recent first
            const sortedJourneys = [...allJourneys].sort((a, b) => 
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
            
            const journeyId = sortedJourneys[0].id;
            
            // Create a salary expense with the TOTAL balance (salary - paid) as the amount
            // This ensures the net profit is reduced by the right amount (what we owe the employee)
            const salaryBalance = existingSalary.salaryAmount - existingSalary.paidAmount;
            
            console.log(`Creating salary expense for journey ${journeyId}. Amount: ${existingSalary.paidAmount}`);
            
            // Create a salary expense with a distinct type to ensure it's recognized in profit calculations
            await storage.createExpense({
              journeyId,
              type: "salary", // Specific type for salary expenses to distinguish them in calculations
              amount: existingSalary.paidAmount, // Use the full paid amount to deduct from profit
              notes: `Salary payment to ${user.name} (Paid: ${existingSalary.paidAmount})`
            });
            
            console.log(`Created salary expense for journey ${journeyId}`);
          } else {
            console.log("No journeys found to attach salary expense");
          }
        } catch (error) {
          console.error("Failed to create salary expense:", error);
          // Continue processing even if this fails
        }
      }
      
      // If payment entries are provided, record them in salary history
      if (paymentEntries && Array.isArray(paymentEntries) && paymentEntries.length > 0) {
        for (const entry of paymentEntries) {
          if (typeof entry.amount === 'number') {
            const isDeduction = entry.amount < 0;
            await storage.createSalaryHistory({
              userId,
              amount: entry.amount,
              type: isDeduction ? 'deduction' : 'payment',
              description: entry.description || (isDeduction 
                ? `Deduction of ${Math.abs(entry.amount)}` 
                : `Payment of ${entry.amount}`)
            });
            
            // If this is a deduction (negative amount), add it back to the net profit
            // by creating a positive salary_refund entry (not just a regular expense)
            if (isDeduction) {
              try {
                // Get all journeys to find one to attach the expense adjustment to
                const allJourneys = await storage.getAllJourneys();
                
                if (allJourneys && allJourneys.length > 0) {
                  // Sort journeys by most recent first
                  const sortedJourneys = [...allJourneys].sort((a, b) => 
                    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                  );
                  
                  const journeyId = sortedJourneys[0].id;
                  const positiveAmount = Math.abs(entry.amount); // Convert negative to positive
                  
                  console.log(`Creating salary_refund for journey ${journeyId}. Adding ${positiveAmount} to profit from deduction`);
                  
                  // Delete any existing refund for this user to avoid duplications
                  try {
                    const existingRefunds = await storage.getExpensesByJourney(journeyId);
                    const userRefunds = existingRefunds.filter(e => 
                      e.type === "salary_refund" && 
                      e.notes && 
                      e.notes.includes(`Salary deduction for ${user.name}`)
                    );
                    
                    // Delete any found refunds
                    for (const refund of userRefunds) {
                      console.log(`Removing previous salary_refund: ${refund.id}`);
                      await storage.deleteExpense(refund.id);
                    }
                  } catch (err) {
                    console.error("Error cleaning up previous refunds:", err);
                  }
                  
                  // Create a positive salary_refund expense (will add to net profit)
                  const newRefund = await storage.createExpense({
                    journeyId,
                    type: "salary_refund", // Special type to indicate this adds to profit
                    amount: positiveAmount, // Use positive amount
                    notes: `Salary deduction for ${user.name} - Adding back to profit (+${positiveAmount})`
                  });
                  
                  console.log(`Created positive salary_refund: ${JSON.stringify(newRefund)}`);
                }
              } catch (error) {
                console.error("Failed to create salary adjustment expense:", error);
                // Continue processing even if this fails
              }
            }
          }
        }
      }
      
      res.status(200).json(updatedSalary);
    } catch (error) {
      console.error(`Error updating salary for user ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update salary data" });
    }
  });
  
  // Get salary history for a user (admin only)
  app.get("/api/user/:id/salary/history", async (req: Request, res: Response) => {
    try {
      // Only admin users can view salary history
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const historyEntries = await storage.getSalaryHistoryByUser(userId);
      res.status(200).json(historyEntries);
    } catch (error) {
      console.error(`Error fetching salary history for user ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch salary history" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}