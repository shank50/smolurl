import bcrypt from "bcrypt";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { signupSchema, loginSchema, type SignupRequest, type LoginRequest } from "@shared/schema";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        profileImageUrl: string | null;
        createdAt: Date;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    anonymousId: string;
  }
}

// Password hashing
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Session middleware to load user
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.session.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        req.user = user;
      } else {
        // Clear invalid session
        req.session.userId = undefined;
      }
    }
    next();
  } catch (error) {
    console.error('Error loading user:', error);
    next();
  }
}

// Authentication routes
export function setupAuth(app: Express) {
  // Load user middleware
  app.use(loadUser);

  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      // Validate request data
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: result.error.errors,
        });
      }

      const { firstName, email, password } = result.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "An account with this email already exists",
        });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        firstName,
        email,
        password: hashedPassword,
      });

      // Create session
      req.session.userId = user.id;

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: "Failed to create account. Please try again.",
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      // Validate request data
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: result.error.errors,
        });
      }

      const { email, password } = result.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Create session
      req.session.userId = user.id;

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        message: "Failed to sign in. Please try again.",
      });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          message: "Failed to sign out",
        });
      }
      res.json({ message: "Signed out successfully" });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json(null);
    }
  });
}