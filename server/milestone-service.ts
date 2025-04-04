import { storage } from "./storage";
import { milestoneTypes } from "@shared/schema";
import type { Journey, LocationHistory } from "@shared/schema";

export async function createJourneyStartMilestone(journey: Journey) {
  try {
    return await storage.createMilestone({
      journeyId: journey.id,
      type: "JOURNEY_START",
      title: "Journey Started",
      message: `Journey to ${journey.destination} has started.`,
      isDismissed: false,
    });
  } catch (error) {
    console.error("Error creating journey start milestone:", error);
    return null;
  }
}

export async function createJourneyEndMilestone(journey: Journey) {
  try {
    return await storage.createMilestone({
      journeyId: journey.id,
      type: "JOURNEY_END",
      title: "Journey Completed",
      message: `Journey to ${journey.destination} has been completed.`,
      isDismissed: false,
    });
  } catch (error) {
    console.error("Error creating journey end milestone:", error);
    return null;
  }
}

export async function checkAndCreateDistanceMilestones(
  journey: Journey,
  location: LocationHistory
) {
  if (!journey.totalDistance) return null;
  
  try {
    // Get previous milestones to avoid duplicates
    const existingMilestones = await storage.getMilestonesByJourney(journey.id);
    const distanceMilestones = existingMilestones.filter(
      m => m.type === "DISTANCE_MILESTONE" || m.type === "HALFWAY_POINT"
    );
    
    // Check for halfway point
    const halfwayPoint = journey.totalDistance / 2;
    const isHalfwayReached = 
      !distanceMilestones.some(m => m.type === "HALFWAY_POINT") && 
      location.distanceCovered && 
      location.distanceCovered >= halfwayPoint;
    
    if (isHalfwayReached) {
      return await storage.createMilestone({
        journeyId: journey.id,
        type: "HALFWAY_POINT",
        title: "Halfway Point Reached",
        message: `You've completed half of your journey to ${journey.destination}.`,
        isDismissed: false,
      });
    }
    
    // Check for distance milestones (every 100km)
    if (location.distanceCovered) {
      const currentHundred = Math.floor(location.distanceCovered / 100) * 100;
      
      // Skip if we already have a milestone for this distance
      const hasMilestoneForDistance = distanceMilestones.some(
        m => {
          if (m.type === "DISTANCE_MILESTONE" && m.data) {
            try {
              const dataObj = typeof m.data === 'string' 
                ? JSON.parse(m.data) 
                : (m.data as Record<string, any>);
                
              return dataObj?.distance === currentHundred;
            } catch (e) {
              console.error('Error parsing milestone data:', e);
              return false;
            }
          }
          return false;
        }
      );
      
      if (currentHundred > 0 && !hasMilestoneForDistance) {
        return await storage.createMilestone({
          journeyId: journey.id,
          type: "DISTANCE_MILESTONE",
          title: `${currentHundred}km Traveled`,
          message: `You've traveled ${currentHundred}km on your journey.`,
          data: { distance: currentHundred },
          isDismissed: false,
        });
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error checking distance milestones:", error);
    return null;
  }
}

export async function createExpenseAlertMilestone(journey: Journey, expenseAmount: number) {
  try {
    // Get total expenses
    const expenses = await storage.getExpensesByJourney(journey.id);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Alert if expenses exceed 80% of pouch amount
    if (journey.pouch > 0 && totalExpenses >= journey.pouch * 0.8) {
      return await storage.createMilestone({
        journeyId: journey.id,
        type: "EXPENSE_ALERT",
        title: "Expense Alert",
        message: `Your expenses (₹${totalExpenses}) are approaching your pouch amount (₹${journey.pouch}).`,
        data: { 
          totalExpenses,
          pouchAmount: journey.pouch,
          percentage: Math.round((totalExpenses / journey.pouch) * 100) 
        },
        isDismissed: false,
      });
    }
    
    return null;
  } catch (error) {
    console.error("Error creating expense alert milestone:", error);
    return null;
  }
}

export async function createRestReminderMilestone(journey: Journey) {
  try {
    // Get current time and journey start time
    const now = new Date();
    const journeyStart = new Date(journey.startTime);
    
    // Calculate hours since journey started
    const hoursSinceStart = (now.getTime() - journeyStart.getTime()) / (1000 * 60 * 60);
    
    // Get existing rest reminders
    const existingMilestones = await storage.getMilestonesByJourney(journey.id);
    const restReminders = existingMilestones.filter(m => m.type === "REST_REMINDER");
    
    // Create a reminder every 4 hours if one doesn't already exist for this period
    const reminderPeriod = Math.floor(hoursSinceStart / 4);
    const hasReminderForPeriod = restReminders.some(
      m => {
        if (m.data) {
          try {
            const dataObj = typeof m.data === 'string' 
              ? JSON.parse(m.data) 
              : (m.data as Record<string, any>);
              
            return dataObj?.period === reminderPeriod;
          } catch (e) {
            console.error('Error parsing milestone data:', e);
            return false;
          }
        }
        return false;
      }
    );
    
    if (reminderPeriod > 0 && !hasReminderForPeriod) {
      return await storage.createMilestone({
        journeyId: journey.id,
        type: "REST_REMINDER",
        title: "Rest Reminder",
        message: `You've been driving for ${reminderPeriod * 4} hours. Consider taking a break for safety.`,
        data: { period: reminderPeriod },
        isDismissed: false,
      });
    }
    
    return null;
  } catch (error) {
    console.error("Error creating rest reminder milestone:", error);
    return null;
  }
}