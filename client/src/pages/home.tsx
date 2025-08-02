import { UrlShortenerForm } from "@/components/url-shortener-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Clock, Link2, Zap, BarChart3, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { copyToClipboard, formatRelativeTime } from "@/lib/url-utils";
import { useToast } from "@/hooks/use-toast";

// Recent URLs for anonymous users (stored in localStorage)
function getRecentAnonymousUrls() {
  try {
    const stored = localStorage.getItem('smolurl-recent-urls');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentAnonymousUrl(url: any) {
  try {
    const existing = getRecentAnonymousUrls();
    const updated = [url, ...existing.slice(0, 9)]; // Keep last 10
    localStorage.setItem('smolurl-recent-urls', JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export default function Home() {
  const { toast } = useToast();
  const recentUrls = getRecentAnonymousUrls();

  const handleCopy = async (url: string) => {
    try {
      await copyToClipboard(url);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Subtle pattern background */}
        <div className="absolute inset-0 pattern-dots opacity-50" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center mb-12 animate-fade-in-up">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
              Shorten. Share.{" "}
              <span className="text-primary">Track.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform long URLs into short, memorable links.
              Track clicks and analyze your audience with powerful analytics.
            </p>
          </div>

          {/* URL Form Card */}
          <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <UrlShortenerForm />
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card soft-card text-sm font-medium text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>Instant shortening</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card soft-card text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Click analytics</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card soft-card text-sm font-medium text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Custom links</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent URLs Section */}
      {recentUrls.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Recent URLs</h2>
              </div>

              <div className="space-y-3">
                {recentUrls.map((url: any, index: number) => (
                  <div
                    key={index}
                    className={`soft-card p-5 animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                    data-testid={`recent-url-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-primary font-mono text-sm bg-primary/10 px-3 py-1.5 rounded-lg font-medium">
                            {url.shortUrl?.replace('https://', '')}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(url.shortUrl)}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            data-testid={`button-copy-recent-${index}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground truncate font-mono">
                          {url.originalUrl}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <Badge variant="secondary" className="font-medium">Anonymous</Badge>
                          <div className="text-xs text-muted-foreground mt-1.5">
                            {formatRelativeTime(new Date(url.createdAt || Date.now()))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
