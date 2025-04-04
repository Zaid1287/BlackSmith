import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle instance with all schema tables
export const db = drizzle(pool, { schema });

// Export pool for session store
export function getPool() {
  return pool;
}