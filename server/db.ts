import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import pg from 'pg';

// Add error handling for database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is required');
}

// Create PostgreSQL connection via postgres-js with improved options
const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connect timeout after 10 seconds
  debug: process.env.NODE_ENV === 'development', // Enable debug logging in development
});

// Create drizzle instance with all schema tables
export const db = drizzle(queryClient, { schema });

// For session store, we need a separate pg connection with better connection handling
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Maximum number of connections for session store
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Connection timeout after 5 seconds
});

// Add connection error handling
pgPool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Export pool for session store
export function getPool() {
  return pgPool;
}