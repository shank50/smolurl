import { UrlShortenerForm } from "@/components/url-shortener-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Clock } from "lucide-react";
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
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <UrlShortenerForm />

      {/* Recent URLs (Anonymous) */}
      {recentUrls.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>Recent URLs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUrls.map((url: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-md hover:bg-muted/50 transition-colors"
                  data-testid={`recent-url-${index}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <code className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                        {url.shortUrl?.replace('https://', '')}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(url.shortUrl)}
                        data-testid={`button-copy-recent-${index}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground truncate font-mono">
                      {url.originalUrl}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <div className="text-right">
                      <Badge variant="secondary">Anonymous</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(new Date(url.createdAt || Date.now()))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
