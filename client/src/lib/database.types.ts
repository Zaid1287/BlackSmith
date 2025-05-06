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
        Relationships: []
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
        Relationships: []
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
          initialExpense?: number
          pouch?: number
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
        Relationships: [
          {
            foreignKeyName: "journeys_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_vehiclePlate_fkey"
            columns: ["vehiclePlate"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["licensePlate"]
          }
        ]
      }
      expenses: {
        Row: {
          id: number
          journeyId: number
          type: string
          amount: number
          description: string | null
          timestamp: string
          createdAt: string
        }
        Insert: {
          id?: number
          journeyId: number
          type: string
          amount: number
          description?: string | null
          timestamp?: string
          createdAt?: string
        }
        Update: {
          id?: number
          journeyId?: number
          type?: string
          amount?: number
          description?: string | null
          timestamp?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_journeyId_fkey"
            columns: ["journeyId"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          }
        ]
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
          speed?: number
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
        Relationships: [
          {
            foreignKeyName: "location_history_journeyId_fkey"
            columns: ["journeyId"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "milestones_journeyId_fkey"
            columns: ["journeyId"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "journey_photos_journeyId_fkey"
            columns: ["journeyId"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          }
        ]
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
          amount?: number
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
        Relationships: [
          {
            foreignKeyName: "salaries_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      salary_history: {
        Row: {
          id: number
          userId: number
          amount: number
          type: string
          description: string | null
          timestamp: string
          createdAt: string
        }
        Insert: {
          id?: number
          userId: number
          amount: number
          type: string
          description?: string | null
          timestamp?: string
          createdAt?: string
        }
        Update: {
          id?: number
          userId?: number
          amount?: number
          type?: string
          description?: string | null
          timestamp?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_history_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}