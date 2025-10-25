import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { useUrlAnalytics } from "@/hooks/use-url-shortener";
import { copyToClipboard, truncateUrl } from "@/lib/url-utils";
import { useToast } from "@/hooks/use-toast";
import type { UrlWithAnalytics } from "@shared/schema";

interface AnalyticsProps {
  url: UrlWithAnalytics;
  onBack: () => void;
}

export default function Analytics({ url, onBack }: AnalyticsProps) {
  const { data: analyticsData, isLoading } = useUrlAnalytics(url.id);
  const { toast } = useToast();

  const handleCopy = async (urlToCopy: string) => {
    try {
      await copyToClipboard(urlToCopy);
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

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-12 bg-muted rounded w-96"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!analyticsData) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load analytics data.</p>
          </div>
        </div>
      </main>
    );
  }

  const shortUrl = url.shortUrl;

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h2 className="text-2xl font-bold mb-2">Analytics</h2>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <code className="text-primary font-mono bg-primary/10 px-2 py-1 rounded text-sm">
                      {shortUrl.replace('https://', '')}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(shortUrl)}
                      data-testid="button-copy-short-url"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <span>→</span>
                    <span className="font-mono text-sm truncate max-w-md">
                      {truncateUrl(url.originalUrl, 80)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AnalyticsCharts analytics={analyticsData.analytics} />
      </div>
    </main>
  );
}
