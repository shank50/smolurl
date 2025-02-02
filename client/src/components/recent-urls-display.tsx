import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, truncateUrl, formatRelativeTime } from "@/lib/url-utils";

type RecentUrl = {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  isAnonymous: boolean;
  createdAt: string;
};

interface RecentUrlsDisplayProps {
  recentUrls: RecentUrl[];
}

export function RecentUrlsDisplay({ recentUrls }: RecentUrlsDisplayProps) {
  const { toast } = useToast();

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

  if (recentUrls.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3" data-testid="recent-urls-display">
      <h4 className="text-sm font-medium text-muted-foreground">Your Recent URLs</h4>
      <div className="space-y-2">
        {recentUrls.map((url, index) => (
          <div
            key={url.id || index}
            className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-md hover:bg-muted/50 transition-colors"
            data-testid={`recent-url-item-${index}`}
          >
            <div className="flex-1 min-w-0">
              {/* Short URL */}
              <div className="flex items-center space-x-2 mb-1">
                <code className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                  {url.shortUrl?.replace('https://', '') || `smolurl.shank50.dev/${url.shortCode}`}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(url.shortUrl || `https://smolurl.shank50.dev/${url.shortCode}`)}
                  data-testid={`button-copy-short-${index}`}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-6 w-6 p-0"
                >
                  <a 
                    href={url.shortUrl || `https://smolurl.shank50.dev/${url.shortCode}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    data-testid={`button-visit-short-${index}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
              
              {/* Original URL */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {truncateUrl(url.originalUrl, 60)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(url.originalUrl)}
                  data-testid={`button-copy-original-${index}`}
                  className="h-5 w-5 p-0"
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            
            {/* Timestamp */}
            <div className="text-xs text-muted-foreground ml-4 flex-shrink-0">
              {formatRelativeTime(new Date(url.createdAt || Date.now()))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}