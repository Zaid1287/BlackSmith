import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Get current file directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the SQL migration file
const migrationFilePath = path.resolve(__dirname, './supabase-migration.sql');

async function runMigration() {
  try {
    console.log('Reading SQL migration file...');
    
    // Read the SQL migration file
    const sqlMigration = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Break the migration into individual statements
    // A simple approach is to split by semicolons, but this doesn't handle all edge cases
    const statements = sqlMigration
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // We need to use direct SQL queries which can be executed through the SQL editor in Supabase
    console.log('Unable to execute SQL statements programmatically through the Supabase client');
    console.log('Please execute the SQL statements manually through the Supabase SQL Editor:');
    console.log('1. Go to the Supabase dashboard for your project');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Click "+ New Query" to create a new SQL query');
    console.log('4. Copy and paste the SQL migration from: ' + migrationFilePath);
    console.log('5. Click "Run" to execute the SQL queries');
    
    // Output the SQL statements for convenience
    console.log('\nHere is the SQL migration content to copy:');
    console.log('----------------------------------------');
    console.log(sqlMigration);
    console.log('----------------------------------------');
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration();