export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          username: string
          name: string
          password: string
          isAdmin: boolean
          createdAt: string
        }
        Insert: {
          id?: number
          username: string
          name: string
          password: string
          isAdmin?: boolean
          createdAt?: string
        }
        Update: {
          id?: number
          username?: string
          name?: string
          password?: string
          isAdmin?: boolean
          createdAt?: string
        }
      }
      vehicles: {
        Row: {
          id: number
          licensePlate: string
          make: string
          model: string
          year: number
          createdAt: string
        }
        Insert: {
          id?: number
          licensePlate: string
          make: string
          model: string
          year: number
          createdAt?: string
        }
        Update: {
          id?: number
          licensePlate?: string
          make?: string
          model?: string
          year?: number
          createdAt?: string
        }
      }
      journeys: {
        Row: {
          id: number
          userId: number
          vehiclePlate: string
          startLocation: string
          endLocation: string
          startTime: string
          endTime: string | null
          status: string
          initialExpense: number
          pouch: number
          workingBalance: number
          isComplete: boolean
          createdAt: string
        }
        Insert: {
          id?: number
          userId: number
          vehiclePlate: string
          startLocation: string
          endLocation: string
          startTime?: string
          endTime?: string | null
          status?: string
          initialExpense: number
          pouch: number
          workingBalance?: number
          isComplete?: boolean
          createdAt?: string
        }
        Update: {
          id?: number
          userId?: number
          vehiclePlate?: string
          startLocation?: string
          endLocation?: string
          startTime?: string
          endTime?: string | null
          status?: string
          initialExpense?: number
          pouch?: number
          workingBalance?: number
          isComplete?: boolean
          createdAt?: string
        }
      }
      expenses: {
        Row: {
          id: number
          journeyId: number
          type: string
          amount: number
          description: string
          timestamp: string
          createdAt: string
        }
        Insert: {
          id?: number
          journeyId: number
          type: string
          amount: number
          description: string
          timestamp?: string
          createdAt?: string
        }
        Update: {
          id?: number
          journeyId?: number
          type?: string
          amount?: number
          description?: string
          timestamp?: string
          createdAt?: string
        }
      }
      location_history: {
        Row: {
          id: number
          journeyId: number
          latitude: number
          longitude: number
          timestamp: string
          speed: number
          createdAt: string
        }
        Insert: {
          id?: number
          journeyId: number
          latitude: number
          longitude: number
          timestamp?: string
          speed: number
          createdAt?: string
        }
        Update: {
          id?: number
          journeyId?: number
          latitude?: number
          longitude?: number
          timestamp?: string
          speed?: number
          createdAt?: string
        }
      }
      milestones: {
        Row: {
          id: number
          journeyId: number
          type: string
          message: string
          timestamp: string
          dismissed: boolean
          createdAt: string
        }
        Insert: {
          id?: number
          journeyId: number
          type: string
          message: string
          timestamp?: string
          dismissed?: boolean
          createdAt?: string
        }
        Update: {
          id?: number
          journeyId?: number
          type?: string
          message?: string
          timestamp?: string
          dismissed?: boolean
          createdAt?: string
        }
      }
      journey_photos: {
        Row: {
          id: number
          journeyId: number
          photoUrl: string
          timestamp: string
          createdAt: string
        }
        Insert: {
          id?: number
          journeyId: number
          photoUrl: string
          timestamp?: string
          createdAt?: string
        }
        Update: {
          id?: number
          journeyId?: number
          photoUrl?: string
          timestamp?: string
          createdAt?: string
        }
      }
      salaries: {
        Row: {
          id: number
          userId: number
          amount: number
          paid: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          userId: number
          amount: number
          paid?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          userId?: number
          amount?: number
          paid?: number
          createdAt?: string
          updatedAt?: string
        }
      }
      salary_history: {
        Row: {
          id: number
          userId: number
          amount: number
          type: string
          description: string
          timestamp: string
          createdAt: string
        }
        Insert: {
          id?: number
          userId: number
          amount: number
          type: string
          description: string
          timestamp?: string
          createdAt?: string
        }
        Update: {
          id?: number
          userId?: number
          amount?: number
          type?: string
          description?: string
          timestamp?: string
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}