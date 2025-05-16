import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create PostgreSQL connection via postgres-js
const queryClient = postgres(process.env.DATABASE_URL!);

// Create drizzle instance with all schema tables 
export const db = drizzle(queryClient, { schema });

// For session store, we need a separate pg connection
import pg from 'pg';
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Export pool for session store
export function getPool() {
  return pgPool;
}