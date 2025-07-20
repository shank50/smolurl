import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { UrlService } from "./services/urlService";
import { AnalyticsService } from "./services/analyticsService";
import { urlShortenSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import rateLimit from "express-rate-limit";
import { setupAuth } from "./auth";

// Rate limiting cause why not LOL
const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many URL creation attempts, please try again later",
});

const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Very high limit for redirects
  message: "Too many redirect requests",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  }));

  // Health check - pings database to warm up Neon
  app.get('/api/health', async (req, res) => {
    try {
      await storage.pingDatabase();
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({ status: 'warming', timestamp: new Date().toISOString() });
    }
  });

  // Setup authentication
  setupAuth(app);

  // Get or create anonymous session
  app.use((req, res, next) => {
    if (!req.session.anonymousId) {
      req.session.anonymousId = randomUUID();
    }
    next();
  });

  // URL shortening endpoint
  app.post('/api/urls/shorten', createUrlLimiter, async (req: Request, res: Response) => {
    try {
      const validatedData = urlShortenSchema.parse(req.body);

      // Check if user is authenticated
      const userId = req.user?.id;

      // If not authenticated, check anonymous session limits
      if (!userId) {
        const anonymousId = req.session.anonymousId!;
        let anonymousSession = await storage.getAnonymousSession(anonymousId);

        if (!anonymousSession) {
          anonymousSession = await storage.createAnonymousSession({
            sessionId: anonymousId,
            urlCount: 0,
          });
        }

        if ((anonymousSession.urlCount || 0) >= 10) {
          return res.status(429).json({
            message: "Anonymous user limit reached. Please sign up to continue.",
            code: "ANONYMOUS_LIMIT_REACHED",
          });
        }

        // Create URL for anonymous user
        const result = await UrlService.shortenUrl(validatedData);

        // Update anonymous session count
        await storage.updateAnonymousSession(anonymousId!, {
          urlCount: (anonymousSession.urlCount || 0) + 1,
        });

        const shortUrl = UrlService.buildShortUrl(result.shortCode);

        return res.json({
          id: result.id,
          shortCode: result.shortCode,
          shortUrl,
          originalUrl: validatedData.originalUrl,
          isAnonymous: true,
          remainingUrls: 10 - ((anonymousSession.urlCount || 0) + 1),
        });
      }

      // Create URL for authenticated user
      const result = await UrlService.shortenUrl(validatedData, userId);
      const shortUrl = UrlService.buildShortUrl(result.shortCode);

      res.json({
        id: result.id,
        shortCode: result.shortCode,
        shortUrl,
        originalUrl: validatedData.originalUrl,
        isAnonymous: false,
      });
    } catch (error: any) {
      console.error('Error shortening URL:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }

      res.status(500).json({
        message: error.message || "Failed to shorten URL",
      });
    }
  });



  // Get user's URLs (authenticated only)  
  app.get('/api/urls', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const urls = await storage.getUrlsByUserId(userId);
      const urlsWithShortUrls = urls.map(url => ({
        ...url,
        shortUrl: UrlService.buildShortUrl(url.shortCode),
      }));

      res.json(urlsWithShortUrls);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      res.status(500).json({ message: "Failed to fetch URLs" });
    }
  });

  // Get URL analytics (authenticated only)
  app.get('/api/urls/:id/analytics', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      // Verify URL belongs to user
      const urls = await storage.getUrlsByUserId(userId);
      const url = urls.find(u => u.id === id);

      if (!url) {
        return res.status(404).json({ message: "URL not found" });
      }

      const analytics = await storage.getUrlAnalytics(id);

      res.json({
        url: {
          ...url,
          shortUrl: UrlService.buildShortUrl(url.shortCode),
        },
        analytics,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Delete URL (authenticated only)
  app.delete('/api/urls/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const success = await storage.deleteUrl(id, userId);

      if (!success) {
        return res.status(404).json({ message: "URL not found" });
      }

      res.json({ message: "URL deleted successfully" });
    } catch (error) {
      console.error('Error deleting URL:', error);
      res.status(500).json({ message: "Failed to delete URL" });
    }
  });

  // Get user dashboard stats (authenticated only)
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Get anonymous session info
  app.get('/api/session/anonymous', async (req: Request, res: Response) => {
    try {
      const anonymousId = req.session.anonymousId;
      if (!anonymousId) {
        return res.json({ urlCount: 0, remainingUrls: 10 });
      }

      const session = await storage.getAnonymousSession(anonymousId);
      const urlCount = session?.urlCount || 0;

      res.json({
        urlCount,
        remainingUrls: Math.max(0, 10 - urlCount),
      });
    } catch (error) {
      console.error('Error fetching anonymous session:', error);
      res.status(500).json({ message: "Failed to fetch session info" });
    }
  });

  // URL redirect endpoint (with analytics tracking) - catch short codes but not API routes
  app.get('/:shortCode([a-zA-Z0-9_-]+)', redirectLimiter, async (req: Request, res: Response) => {
    try {
      const { shortCode } = req.params;

      const url = await storage.getUrlByShortCode(shortCode);
      if (!url) {
        return res.status(404).json({ message: "URL not found" });
      }

      // Record analytics - Get real client IP from headers (for proxies like Render)
      const ipAddress = req.get('CF-Connecting-IP') ||
        req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        req.get('X-Real-IP') ||
        req.ip ||
        req.connection.remoteAddress ||
        'unknown';
      const userAgent = req.get('User-Agent') || '';
      const referer = req.get('Referer');

      // Don't wait for analytics recording to complete the redirect
      AnalyticsService.recordClick(url.id, ipAddress, userAgent, referer).catch(console.error);

      // Redirect to original URL
      res.redirect(301, url.originalUrl);
    } catch (error) {
      console.error('Error redirecting URL:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
