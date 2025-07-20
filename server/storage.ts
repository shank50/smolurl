import {
  users,
  urls,
  urlClicks,
  anonymousSessions,
  type User,
  type UpsertUser,
  type Url,
  type InsertUrl,
  type UrlClick,
  type InsertUrlClick,
  type AnonymousSession,
  type InsertAnonymousSession,
  type UrlWithAnalytics,
  type ClickAnalytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: { firstName: string; email: string; password: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // URL operations
  createUrl(urlData: InsertUrl): Promise<Url>;
  getUrlByShortCode(shortCode: string): Promise<Url | undefined>;
  getUrlsByUserId(userId: string): Promise<UrlWithAnalytics[]>;
  getUserUrlCount(userId: string): Promise<number>;
  updateUrl(id: string, data: Partial<Url>): Promise<Url | undefined>;
  deleteUrl(id: string, userId: string): Promise<boolean>;

  // Click tracking
  recordClick(clickData: InsertUrlClick): Promise<UrlClick>;
  getUrlAnalytics(urlId: string): Promise<ClickAnalytics>;
  getUrlClickCount(urlId: string): Promise<number>;

  // Anonymous session operations
  getAnonymousSession(sessionId: string): Promise<AnonymousSession | undefined>;
  createAnonymousSession(sessionData: InsertAnonymousSession): Promise<AnonymousSession>;
  updateAnonymousSession(sessionId: string, data: Partial<AnonymousSession>): Promise<AnonymousSession | undefined>;

  // Admin/dashboard aggregations
  getUserStats(userId: string): Promise<{
    totalUrls: number;
    totalClicks: number;
    clickRate: number;
    topCountry: string | null;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Database ping for warmup
  async pingDatabase(): Promise<void> {
    await db.execute(sql`SELECT 1`);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { firstName: string; email: string; password: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        firstName: userData.firstName,
        email: userData.email,
        password: userData.password,
        lastName: null,
        profileImageUrl: null,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // URL operations
  async createUrl(urlData: InsertUrl): Promise<Url> {
    const [url] = await db.insert(urls).values(urlData).returning();
    return url;
  }

  async getUrlByShortCode(shortCode: string): Promise<Url | undefined> {
    const [url] = await db
      .select()
      .from(urls)
      .where(and(eq(urls.shortCode, shortCode), eq(urls.isActive, true)));
    return url;
  }

  async getUrlsByUserId(userId: string): Promise<UrlWithAnalytics[]> {
    const urlsWithStats = await db
      .select({
        id: urls.id,
        originalUrl: urls.originalUrl,
        shortCode: urls.shortCode,
        customSlug: urls.customSlug,
        userId: urls.userId,
        isActive: urls.isActive,
        createdAt: urls.createdAt,
        expiresAt: urls.expiresAt,
        clickCount: sql<number>`COALESCE(${count(urlClicks.id)}, 0)`,
      })
      .from(urls)
      .leftJoin(urlClicks, eq(urls.id, urlClicks.urlId))
      .where(eq(urls.userId, userId))
      .groupBy(urls.id)
      .orderBy(desc(urls.createdAt));

    // Get unique clicks and other analytics for each URL
    const urlsWithAnalytics: UrlWithAnalytics[] = await Promise.all(
      urlsWithStats.map(async (url) => {
        const uniqueClicks = await db
          .select({ count: count() })
          .from(urlClicks)
          .where(eq(urlClicks.urlId, url.id));

        const lastClick = await db
          .select({ clickedAt: urlClicks.clickedAt })
          .from(urlClicks)
          .where(eq(urlClicks.urlId, url.id))
          .orderBy(desc(urlClicks.clickedAt))
          .limit(1);

        const topCountry = await db
          .select({ country: urlClicks.country, count: count() })
          .from(urlClicks)
          .where(eq(urlClicks.urlId, url.id))
          .groupBy(urlClicks.country)
          .orderBy(desc(count()))
          .limit(1);

        return {
          ...url,
          uniqueClicks: uniqueClicks[0]?.count || 0,
          lastClicked: lastClick[0]?.clickedAt || undefined,
          topCountry: topCountry[0]?.country || undefined,
          topReferrer: undefined,
        };
      })
    );

    return urlsWithAnalytics;
  }

  async getUserUrlCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(urls)
      .where(eq(urls.userId, userId));
    return result?.count || 0;
  }

  async updateUrl(id: string, data: Partial<Url>): Promise<Url | undefined> {
    const [url] = await db
      .update(urls)
      .set(data)
      .where(eq(urls.id, id))
      .returning();
    return url;
  }

  async deleteUrl(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(urls)
      .where(and(eq(urls.id, id), eq(urls.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Click tracking
  async recordClick(clickData: InsertUrlClick): Promise<UrlClick> {
    const [click] = await db.insert(urlClicks).values(clickData).returning();
    return click;
  }

  async getUrlAnalytics(urlId: string): Promise<ClickAnalytics> {
    // Total clicks
    const [totalClicks] = await db
      .select({ count: count() })
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId));

    // Unique visitors (by IP)
    const [uniqueVisitors] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${urlClicks.ipAddress})` })
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId));

    // Clicks by day (last 30 days)
    const clicksByDay = await db
      .select({
        date: sql<string>`DATE(${urlClicks.clickedAt})`,
        clicks: count(),
      })
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId))
      .groupBy(sql`DATE(${urlClicks.clickedAt})`)
      .orderBy(asc(sql`DATE(${urlClicks.clickedAt})`))
      .limit(30);

    // Clicks by country
    const clicksByCountry = await db
      .select({
        country: urlClicks.country,
        clicks: count(),
      })
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId))
      .groupBy(urlClicks.country)
      .orderBy(desc(count()))
      .limit(10);

    // Calculate percentages for countries
    const totalClicksCount = totalClicks.count || 0;
    const clicksByCountryWithPercentage = clicksByCountry.map(item => ({
      ...item,
      country: item.country || 'Unknown',
      percentage: totalClicksCount > 0 ? Math.round((item.clicks / totalClicksCount) * 100) : 0,
    }));

    // Clicks by device
    const clicksByDevice = await db
      .select({
        device: urlClicks.device,
        clicks: count(),
      })
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId))
      .groupBy(urlClicks.device)
      .orderBy(desc(count()));

    // Clicks by browser
    const clicksByBrowser = await db
      .select({
        browser: urlClicks.browser,
        clicks: count(),
      })
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId))
      .groupBy(urlClicks.browser)
      .orderBy(desc(count()));

    // Recent clicks
    const recentClicksData = await db
      .select()
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId))
      .orderBy(desc(urlClicks.clickedAt))
      .limit(50);

    const recentClicks = recentClicksData.map(click => ({
      timestamp: click.clickedAt!,
      country: click.country || 'Unknown',
      city: click.city || 'Unknown',
      device: click.device || 'Unknown',
      browser: click.browser || 'Unknown',
      referer: click.referer || 'Direct',
    }));

    return {
      totalClicks: totalClicksCount,
      uniqueVisitors: uniqueVisitors.count || 0,
      clicksByDay: clicksByDay.map(item => ({
        date: item.date,
        clicks: item.clicks,
      })),
      clicksByCountry: clicksByCountryWithPercentage,
      clicksByDevice: clicksByDevice.map(item => ({
        device: item.device || 'Unknown',
        clicks: item.clicks,
      })),
      clicksByBrowser: clicksByBrowser.map(item => ({
        browser: item.browser || 'Unknown',
        clicks: item.clicks,
      })),
      recentClicks,
    };
  }

  async getUrlClickCount(urlId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(urlClicks)
      .where(eq(urlClicks.urlId, urlId));
    return result?.count || 0;
  }

  // Anonymous session operations
  async getAnonymousSession(sessionId: string): Promise<AnonymousSession | undefined> {
    const [session] = await db
      .select()
      .from(anonymousSessions)
      .where(eq(anonymousSessions.sessionId, sessionId));
    return session;
  }

  async createAnonymousSession(sessionData: InsertAnonymousSession): Promise<AnonymousSession> {
    const [session] = await db
      .insert(anonymousSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateAnonymousSession(sessionId: string, data: Partial<AnonymousSession>): Promise<AnonymousSession | undefined> {
    const [session] = await db
      .update(anonymousSessions)
      .set({ ...data, lastAccessAt: new Date() })
      .where(eq(anonymousSessions.sessionId, sessionId))
      .returning();
    return session;
  }

  // Admin/dashboard aggregations
  async getUserStats(userId: string): Promise<{
    totalUrls: number;
    totalClicks: number;
    clickRate: number;
    topCountry: string | null;
  }> {
    // Total URLs
    const [totalUrls] = await db
      .select({ count: count() })
      .from(urls)
      .where(eq(urls.userId, userId));

    // Total clicks for user's URLs
    const [totalClicks] = await db
      .select({ count: count() })
      .from(urlClicks)
      .innerJoin(urls, eq(urlClicks.urlId, urls.id))
      .where(eq(urls.userId, userId));

    // Top country
    const [topCountry] = await db
      .select({ country: urlClicks.country, count: count() })
      .from(urlClicks)
      .innerJoin(urls, eq(urlClicks.urlId, urls.id))
      .where(eq(urls.userId, userId))
      .groupBy(urlClicks.country)
      .orderBy(desc(count()))
      .limit(1);

    const totalUrlsCount = totalUrls.count || 0;
    const totalClicksCount = totalClicks.count || 0;
    const clickRate = totalUrlsCount > 0 ? (totalClicksCount / totalUrlsCount) : 0;

    return {
      totalUrls: totalUrlsCount,
      totalClicks: totalClicksCount,
      clickRate: Math.round(clickRate * 100) / 100,
      topCountry: topCountry?.country || null,
    };
  }
}

export const storage = new DatabaseStorage();
