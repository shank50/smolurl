import { storage } from '../storage';
import { GeoService } from './geoService';
import type { InsertUrlClick } from '@shared/schema';

export class AnalyticsService {
  static async recordClick(
    urlId: string,
    ipAddress: string,
    userAgent: string,
    referer?: string
  ): Promise<void> {
    const deviceInfo = this.parseUserAgent(userAgent);
    const location = await GeoService.getLocationFromIP(ipAddress);

    const clickData: InsertUrlClick = {
      urlId,
      ipAddress,
      userAgent,
      referer: referer || null,
      country: location.country,
      city: location.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
    };

    await storage.recordClick(clickData);
  }

  static parseUserAgent(userAgent: string): {
    device: string;
    browser: string;
    os: string;
  } {
    const ua = userAgent.toLowerCase();
    
    // Device detection
    let device = 'Desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      device = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = 'Tablet';
    }

    // Browser detection
    let browser = 'Unknown';
    if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('chrome') && !ua.includes('edg')) {
      browser = 'Chrome';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('edg')) {
      browser = 'Edge';
    } else if (ua.includes('opera')) {
      browser = 'Opera';
    }

    // OS detection
    let os = 'Unknown';
    if (ua.includes('windows')) {
      os = 'Windows';
    } else if (ua.includes('mac os') || ua.includes('macos')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
    }

    return { device, browser, os };
  }

  // Removed - now using GeoService.getLocationFromIP instead

  // Deprecated - use GeoService.getCountryFlag(countryCode) instead
  static getCountryFlag(countryName: string): string {
    // Legacy support - maps country names to flags
    const countryFlags: Record<string, string> = {
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'Brazil': '🇧🇷',
      'Australia': '🇦🇺',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Netherlands': '🇳🇱',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'South Korea': '🇰🇷',
      'Russia': '🇷🇺',
      'Mexico': '🇲🇽',
      'Argentina': '🇦🇷',
      'South Africa': '🇿🇦',
    };
    
    return countryFlags[countryName] || '🌍';
  }
}
