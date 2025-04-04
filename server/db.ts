import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from '@shared/schema';

const { Pool } = pkg;

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create a drizzle instance with the schema
export const db = drizzle(pool, { schema });

// Export the pool for session management
export function getPool() {
  return pool;
}