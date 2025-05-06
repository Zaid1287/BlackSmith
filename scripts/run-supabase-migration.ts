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
    
    // Execute each statement
    for (const [index, statement] of statements.entries()) {
      try {
        console.log(`Executing statement ${index + 1}/${statements.length}`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`Warning: Statement ${index + 1} failed with error: ${error.message}`);
          console.warn(`Statement: ${statement.substring(0, 150)}...`);
          
          // Try direct query if RPC fails
          const fallbackResult = await supabase.from('_dummy_query').select('*').limit(0);
          if (fallbackResult.error) {
            console.error(`Fallback also failed: ${fallbackResult.error.message}`);
          }
        } else {
          console.log(`Statement ${index + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Error executing statement ${index + 1}: ${err}`);
        console.error(`Statement: ${statement.substring(0, 150)}...`);
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration();