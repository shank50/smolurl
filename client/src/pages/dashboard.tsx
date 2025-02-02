import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UrlList } from "@/components/url-list";
import { UrlShortenerForm } from "@/components/url-shortener-form";
import { useDashboardStats } from "@/hooks/use-url-shortener";
import { 
  Link as LinkIcon, 
  MousePointer, 
  TrendingUp, 
  Globe 
} from "lucide-react";
import { getCountryFlag } from "@/lib/url-utils";
import type { UrlWithAnalytics } from "@shared/schema";

interface DashboardProps {
  onViewAnalytics?: (url: UrlWithAnalytics) => void;
  showUrlForm?: boolean;
  onToggleUrlForm?: () => void;
}

export default function Dashboard({ onViewAnalytics, showUrlForm, onToggleUrlForm }: DashboardProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Manage your shortened URLs and view analytics</p>
        </div>

        {/* URL Creation Form (Collapsible) */}
        {showUrlForm && (
          <div className="mb-8">
            <UrlShortenerForm />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-medium text-muted-foreground">Total URLs</h3>
              </div>
              <p className="text-2xl font-bold" data-testid="stat-total-urls">
                {statsLoading ? '...' : stats?.totalUrls?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <MousePointer className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-medium text-muted-foreground">Total Clicks</h3>
              </div>
              <p className="text-2xl font-bold" data-testid="stat-total-clicks">
                {statsLoading ? '...' : stats?.totalClicks?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-medium text-muted-foreground">Avg. Clicks</h3>
              </div>
              <p className="text-2xl font-bold" data-testid="stat-click-rate">
                {statsLoading ? '...' : stats?.clickRate?.toFixed(1) || '0.0'}
              </p>
              <p className="text-xs text-muted-foreground">Per URL</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-medium text-muted-foreground">Top Country</h3>
              </div>
              <div className="flex items-center space-x-2">
                {stats?.topCountry ? (
                  <span className="text-lg font-bold" data-testid="stat-top-country">
                    {stats.topCountry}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">No data</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Most clicks</p>
            </CardContent>
          </Card>
        </div>

        {/* URLs Table */}
        <UrlList 
          onViewAnalytics={onViewAnalytics}
          onCreateNew={onToggleUrlForm}
        />
      </div>
    </main>
  );
}
