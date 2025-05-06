import express from 'express';
import { registerRoutes } from '../server/routes.js';
import { setupServerlessAuth } from '../server/vercel-auth.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup serverless auth for Vercel environment
setupServerlessAuth(app);

// Setup routes (but don't recreate auth routes since we've already set them up)
const setupRoutesWithoutAuth = async () => {
  const server = await registerRoutes(app, { skipAuth: true });
  return server;
};

// Initialize routes
await setupRoutesWithoutAuth();

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export the Express API
export default app;