-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id SERIAL PRIMARY KEY,
  "licensePlate" TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Journeys Table
CREATE TABLE IF NOT EXISTS public.journeys (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES public.users(id),
  "vehiclePlate" TEXT NOT NULL REFERENCES public.vehicles("licensePlate"),
  "startLocation" TEXT NOT NULL,
  "endLocation" TEXT NOT NULL,
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "endTime" TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  "initialExpense" NUMERIC(10,2) NOT NULL DEFAULT 0,
  pouch NUMERIC(10,2) NOT NULL DEFAULT 0,
  "workingBalance" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "isComplete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id SERIAL PRIMARY KEY,
  "journeyId" INTEGER NOT NULL REFERENCES public.journeys(id),
  type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Location History Table
CREATE TABLE IF NOT EXISTS public.location_history (
  id SERIAL PRIMARY KEY,
  "journeyId" INTEGER NOT NULL REFERENCES public.journeys(id),
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  speed NUMERIC(10,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Milestones Table
CREATE TABLE IF NOT EXISTS public.milestones (
  id SERIAL PRIMARY KEY,
  "journeyId" INTEGER NOT NULL REFERENCES public.journeys(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Journey Photos Table
CREATE TABLE IF NOT EXISTS public.journey_photos (
  id SERIAL PRIMARY KEY,
  "journeyId" INTEGER NOT NULL REFERENCES public.journeys(id),
  "photoUrl" TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Salaries Table
CREATE TABLE IF NOT EXISTS public.salaries (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES public.users(id),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Salary History Table
CREATE TABLE IF NOT EXISTS public.salary_history (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES public.users(id),
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

-- Create admin policy for all tables
CREATE POLICY admin_all_users ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_vehicles ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_journeys ON public.journeys FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_expenses ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_location_history ON public.location_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_milestones ON public.milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_journey_photos ON public.journey_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_salaries ON public.salaries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_salary_history ON public.salary_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- NOTE: Default user creation has been removed for security reasons.
-- Please create admin and driver users through a secure process after deployment.
-- Example:
-- INSERT INTO public.users (username, name, password, "isAdmin")
-- VALUES 
--   ('admin', 'Admin User', '[SECURELY_HASHED_PASSWORD]', true),
--   ('driver', 'Driver User', '[SECURELY_HASHED_PASSWORD]', false)
-- ON CONFLICT (username) DO NOTHING;

-- Insert sample vehicles
INSERT INTO public.vehicles ("licensePlate", make, model, year)
VALUES 
  ('ABC123', 'Toyota', 'Hilux', 2022),
  ('XYZ789', 'Tata', 'Prima', 2023)
ON CONFLICT ("licensePlate") DO NOTHING;

-- Create storage bucket for journey photos
-- Note: This would typically be done via the Supabase UI or API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('journey-photos', 'Journey Photos', false);