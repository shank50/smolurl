import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import 'dotenv/config';


neonConfig.webSocketConstructor = ws;

// Use environment variable or fallback to provided NeonDB connection string
const DATABASE_URL = process.env.DATABASE_URL

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });