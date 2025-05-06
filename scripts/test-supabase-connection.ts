import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if environment variables are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  try {
    // Just test if we can get the server timestamp
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('Connection test result: FAILED');
      console.error('Error:', error.message);
    } else {
      console.log('Connection test result: SUCCESS');
      console.log('Connected to Supabase successfully!');
      console.log('Session data:', data || 'No active session (expected)');
    }
  } catch (err) {
    console.log('Connection test result: FAILED');
    console.error('Error:', err);
  }
}

// Run the test
testConnection();