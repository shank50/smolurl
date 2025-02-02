import { customAlphabet } from 'nanoid';
import { storage } from '../storage';
import type { InsertUrl, UrlShortenRequest } from '@shared/schema';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 6);

export class UrlService {
  static async shortenUrl(data: UrlShortenRequest, userId?: string): Promise<{ shortCode: string; id: string }> {
    let shortCode = data.customSlug;
    
    // If no custom slug provided, generate a random one
    if (!shortCode) {
      shortCode = nanoid();
      
      // Ensure uniqueness
      let attempts = 0;
      while (await storage.getUrlByShortCode(shortCode) && attempts < 10) {
        shortCode = nanoid();
        attempts++;
      }
      
      if (attempts >= 10) {
        throw new Error('Unable to generate unique short code. Please try again.');
      }
    } else {
      // Check if custom slug is already taken
      const existing = await storage.getUrlByShortCode(shortCode);
      if (existing) {
        throw new Error('This custom slug is already taken. Please choose a different one.');
      }
    }

    const urlData: InsertUrl = {
      originalUrl: data.originalUrl,
      shortCode,
      customSlug: data.customSlug || null,
      userId: userId || null,
      isActive: true,
    };

    const url = await storage.createUrl(urlData);
    return { shortCode: url.shortCode, id: url.id };
  }

  static async getOriginalUrl(shortCode: string): Promise<string | null> {
    const url = await storage.getUrlByShortCode(shortCode);
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
}
