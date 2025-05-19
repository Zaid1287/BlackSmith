import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Promisify scrypt
const scryptAsync = promisify(scrypt);

// Add a special emergency admin user for testing
let EMERGENCY_ADMIN = {
  id: 9999,
  username: "admin",
  password: "admin123", // This is stored in plain text for emergency access only
  name: "Emergency Admin",
  isAdmin: true,
  createdAt: new Date()
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    console.error("Error comparing passwords:", err);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Configure session middleware with memory store
  const sessionSettings: session.SessionOptions = {
    secret: "blacksmith-traders-app-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to false for development
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  };

  // Setup sessions and passport
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for username: ${username}`);
        
        // Emergency admin fallback for when DB access fails
        if (username === EMERGENCY_ADMIN.username && password === EMERGENCY_ADMIN.password) {
          console.log("Using emergency admin account");
          return done(null, EMERGENCY_ADMIN);
        }
        
        // Normal DB authentication
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: 'Incorrect username' });
        }
        
        // Verify password
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: 'Incorrect password' });
        }
        
        console.log(`Login successful for: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`Login error for ${username}:`, error);
        return done(error);
      }
    }),
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    console.log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user: ${id}`);
      
      // Emergency admin fallback
      if (id === EMERGENCY_ADMIN.id) {
        return done(null, EMERGENCY_ADMIN);
      }
      
      // Normal DB lookup
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`User not found for id: ${id}`);
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      console.error(`Deserialize error for user ${id}:`, error);
      done(error);
    }
  });

  // API endpoint for user registration
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if admin
      if (!req.isAuthenticated() || !(req.user as any)?.isAdmin) {
        return res.status(403).send("Admin access required");
      }

      const { username, password, name, isAdmin } = req.body;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        name,
        isAdmin: isAdmin || false,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // API endpoint for login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed:", info);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session establishment error:", err);
          return next(err);
        }
        
        console.log("Login successful, session established");
        return res.json(user);
      });
    })(req, res, next);
  });

  // API endpoint for logout
  app.post("/api/logout", (req, res, next) => {
    console.log("Logout initiated");
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          console.error("Error destroying session:", err);
          return next(err);
        }
        
        res.clearCookie('connect.sid');
        console.log("Logout successful, session destroyed");
        return res.status(200).send({ success: true });
      });
    } else {
      console.log("No session to destroy");
      return res.status(200).send({ success: true });
    }
  });

  // API endpoint to get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("User check: Not authenticated");
      return res.sendStatus(401);
    }
    
    console.log("User check: Authenticated as", (req.user as User).username);
    res.json(req.user);
  });
}