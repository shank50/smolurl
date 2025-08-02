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

  const statCards = [
    {
      icon: LinkIcon,
      label: "Total URLs",
      value: statsLoading ? '...' : stats?.totalUrls?.toLocaleString() || '0',
      subtitle: "All time",
      testId: "stat-total-urls"
    },
    {
      icon: MousePointer,
      label: "Total Clicks",
      value: statsLoading ? '...' : stats?.totalClicks?.toLocaleString() || '0',
      subtitle: "All time",
      testId: "stat-total-clicks"
    },
    {
      icon: TrendingUp,
      label: "Avg. Clicks",
      value: statsLoading ? '...' : stats?.clickRate?.toFixed(1) || '0.0',
      subtitle: "Per URL",
      testId: "stat-click-rate"
    },
    {
      icon: Globe,
      label: "Top Country",
      value: stats?.topCountry || 'No data',
      subtitle: "Most clicks",
      testId: "stat-top-country",
      isText: true
    }
  ];

  return (
    <main className="min-h-screen py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-10 animate-fade-in-up">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage your shortened URLs and view analytics</p>
          </div>

          {/* URL Creation Form (Collapsible) */}
          {showUrlForm && (
            <div className="mb-10 animate-fade-in-up">
              <UrlShortenerForm />
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {statCards.map((stat, index) => (
              <div
                key={stat.label}
                className={`soft-card p-6 animate-fade-in-up stagger-${index + 1}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                </div>
                <p
                  className={`text-3xl font-bold tracking-tight ${stat.isText && !stats?.topCountry ? 'text-muted-foreground text-lg' : ''}`}
                  data-testid={stat.testId}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">{stat.subtitle}</p>
              </div>
            ))}
          </div>

          {/* URLs Table */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <UrlList
              onViewAnalytics={onViewAnalytics}
              onCreateNew={onToggleUrlForm}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
