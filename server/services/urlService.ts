import { customAlphabet } from 'nanoid';
import { db } from '../db';
import { urls } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { InsertUrl, UrlShortenRequest } from '@shared/schema';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 6);

// Reserved slugs that cannot be used as custom URLs
const RESERVED_SLUGS = [
  'api', 'admin', 'login', 'signup', 'register', 'dashboard',
  'auth', 'static', 'assets', 'health', 'status', 'settings',
  'profile', 'account', 'help', 'support', 'terms', 'privacy',
  'about', 'contact', 'home', 'index', 'favicon', 'robots'
];

export class UrlService {

  static async shortenUrl(data: UrlShortenRequest, userId?: string): Promise<{ shortCode: string; id: string }> {
    const maxAttempts = 10;

    // Normalize custom slug if provided
    const customSlug = data.customSlug?.trim() || null;

    // Validate custom slug against reserved words
    if (customSlug) {
      if (RESERVED_SLUGS.includes(customSlug.toLowerCase())) {
        throw new Error('This URL slug is reserved and cannot be used. Please choose a different one.');
      }
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shortCode = customSlug || nanoid();

      try {
        // Single atomic insert - let DB handle uniqueness via unique constraint
        const [url] = await db
          .insert(urls)
          .values({
            originalUrl: data.originalUrl,
            shortCode,
            customSlug: customSlug,
            userId: userId || null,
            isActive: true,
          })
          .returning();

        return { shortCode: url.shortCode, id: url.id };
      } catch (error: any) {
        // PostgreSQL unique constraint violation error code
        const isUniqueViolation = error.code === '23505' ||
          error.message?.includes('unique constraint') ||
          error.message?.includes('duplicate key');

        if (isUniqueViolation) {
          // If custom slug collision, don't retry - fail immediately with clear message
          if (customSlug) {
            throw new Error('This custom URL is already taken. Please choose a different one.');
          }
          // If random code collision, retry with a new generated code
          continue;
        }

        // For any other error, rethrow
        throw error;
      }
    }

    // This is extremely rare - only happens if we hit 10 consecutive collisions
    throw new Error('Unable to generate unique short code. Please try again.');
  }

  static async getOriginalUrl(shortCode: string): Promise<string | null> {
    const [url] = await db
      .select()
      .from(urls)
      .where(and(eq(urls.shortCode, shortCode), eq(urls.isActive, true)));
    return url ? url.originalUrl : null;
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static buildShortUrl(shortCode: string): string {
    const domain = process.env.SHORT_DOMAIN || 'localhost:5000';
    return `https://${domain}/${shortCode}`;
  }

  static normalizeUrl(url: string): string {
    // Auto-add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  static isReservedSlug(slug: string): boolean {
    return RESERVED_SLUGS.includes(slug.toLowerCase());
  }

  static getReservedSlugs(): string[] {
    return [...RESERVED_SLUGS];
  }
}
