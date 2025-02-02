import { useState, useEffect } from 'react';

type RecentUrl = {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  isAnonymous: boolean;
  createdAt: string;
};

export function useRecentAnonymousUrls() {
  const [recentUrls, setRecentUrls] = useState<RecentUrl[]>([]);

  const getRecentUrls = (): RecentUrl[] => {
    try {
      const stored = localStorage.getItem('smolurl-recent-urls');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveRecentUrl = (url: RecentUrl) => {
    try {
      const existing = getRecentUrls();
      const updated = [url, ...existing.slice(0, 9)]; // Keep last 10
      localStorage.setItem('smolurl-recent-urls', JSON.stringify(updated));
      setRecentUrls(updated);
    } catch {
      // Ignore localStorage errors
    }
  };

  const clearRecentUrls = () => {
    try {
      localStorage.removeItem('smolurl-recent-urls');
      setRecentUrls([]);
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    setRecentUrls(getRecentUrls());
  }, []);

  return {
    recentUrls,
    saveRecentUrl,
    clearRecentUrls,
  };
}