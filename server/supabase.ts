import { createClient } from '@supabase/supabase-js';
import { Database } from '../client/src/lib/database.types';

// Check if environment variables are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
}

// Create a Supabase client using service key (admin rights)
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Helper functions for common database operations

// User operations
export async function getUser(id: number) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data || null;
}

export async function createUser(userData: any) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('id');
  
  if (error) throw error;
  return data;
}

// Vehicle operations
export async function getAllVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('id');
  
  if (error) throw error;
  return data;
}

export async function getVehicle(id: number) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Journey operations
export async function getActiveJourneys() {
  const { data, error } = await supabase
    .from('journeys')
    .select(`
      *,
      users (id, name, username),
      vehicles:vehiclePlate (id, licensePlate, make, model)
    `)
    .eq('isComplete', false)
    .order('startTime', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Add more functions as needed for your specific operations

// File upload helper
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) throw error;
  return data;
}

// File download URL helper
export function getFileUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}