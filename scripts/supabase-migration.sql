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

-- Create Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow full access to authenticated users" ON public.users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.vehicles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.journeys FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.location_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.milestones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.journey_photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.salaries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON public.salary_history FOR ALL USING (auth.role() = 'authenticated');