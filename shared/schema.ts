import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// URLs table
export const urls = pgTable("urls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalUrl: text("original_url").notNull(),
  shortCode: varchar("short_code", { length: 10 }).notNull().unique(),
  customSlug: varchar("custom_slug", { length: 50 }),
  userId: varchar("user_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_urls_short_code").on(table.shortCode),
  index("idx_urls_user_id").on(table.userId),
]);

// URL clicks/analytics table
export const urlClicks = pgTable("url_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  urlId: varchar("url_id").notNull().references(() => urls.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  referer: text("referer"),
  country: varchar("country"),
  city: varchar("city"),
  device: varchar("device"),
  browser: varchar("browser"),
  os: varchar("os"),
  clickedAt: timestamp("clicked_at").defaultNow(),
}, (table) => [
  index("idx_url_clicks_url_id").on(table.urlId),
  index("idx_url_clicks_clicked_at").on(table.clickedAt),
]);

// Anonymous sessions for tracking URL limits
export const anonymousSessions = pgTable("anonymous_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  urlCount: integer("url_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessAt: timestamp("last_access_at").defaultNow(),
}, (table) => [
  index("idx_anonymous_sessions_session_id").on(table.sessionId),
]);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUrlSchema = createInsertSchema(urls).omit({
  id: true,
  createdAt: true,
});

export const insertUrlClickSchema = createInsertSchema(urlClicks).omit({
  id: true,
  clickedAt: true,
});

export const insertAnonymousSessionSchema = createInsertSchema(anonymousSessions).omit({
  id: true,
  createdAt: true,
  lastAccessAt: true,
});

// URL shortening request schema
export const urlShortenSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  customSlug: z.string().max(50).regex(/^[a-zA-Z0-9-_]+$/, "Only letters, numbers, hyphens, and underscores allowed").optional().or(z.literal("")),
});

// Authentication schemas
export const signupSchema = z.object({
  firstName: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Url = typeof urls.$inferSelect;
export type InsertUrl = z.infer<typeof insertUrlSchema>;

export type UrlClick = typeof urlClicks.$inferSelect;
export type InsertUrlClick = z.infer<typeof insertUrlClickSchema>;

export type AnonymousSession = typeof anonymousSessions.$inferSelect;
export type InsertAnonymousSession = z.infer<typeof insertAnonymousSessionSchema>;

export type UrlShortenRequest = z.infer<typeof urlShortenSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

// URL with analytics data
export type UrlWithAnalytics = Url & {
  clickCount: number;
  uniqueClicks: number;
  lastClicked?: Date;
  topCountry?: string;
  topReferrer?: string;
  shortUrl?: string;
};

// Analytics data types
export type ClickAnalytics = {
  totalClicks: number;
  uniqueVisitors: number;
  clicksByDay: { date: string; clicks: number }[];
  clicksByCountry: { country: string; clicks: number; percentage: number }[];
  clicksByDevice: { device: string; clicks: number }[];
  clicksByBrowser: { browser: string; clicks: number }[];
  recentClicks: {
    timestamp: Date;
    country: string;
    city: string;
    device: string;
    browser: string;
    referer: string;
  }[];
};
