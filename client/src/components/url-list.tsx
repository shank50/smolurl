import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  ExternalLink,
  BarChart3,
  Trash2,
  Search,
  Plus,
  Link2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUserUrls, useDeleteUrl } from "@/hooks/use-url-shortener";
import { copyToClipboard, formatRelativeTime, truncateUrl } from "@/lib/url-utils";
import { useToast } from "@/hooks/use-toast";
import type { UrlWithAnalytics } from "@shared/schema";

interface UrlListProps {
  onViewAnalytics?: (url: UrlWithAnalytics) => void;
  onCreateNew?: () => void;
}

export function UrlList({ onViewAnalytics, onCreateNew }: UrlListProps) {
  const { data: urls, isLoading } = useUserUrls();
  const deleteUrlMutation = useDeleteUrl();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleDelete = async (urlId: string) => {
    if (confirm("Are you sure you want to delete this URL?")) {
      await deleteUrlMutation.mutateAsync(urlId);
    }
  };

  const filteredUrls = urls?.filter(url =>
    url.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    url.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (url.customSlug && url.customSlug.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (isLoading) {
    return (
      <div className="soft-card p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="soft-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Your URLs</h2>
            <Badge variant="secondary" className="font-medium">
              {filteredUrls.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64 h-10 rounded-xl border-border/60"
                data-testid="input-search-urls"
              />
            </div>
            <Button
              onClick={onCreateNew}
              className="rounded-xl h-10 font-semibold shadow-sm"
              data-testid="button-new-url"
            >
              <Plus className="mr-2 h-4 w-4" />
              New URL
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-4">
        {filteredUrls.length === 0 ? (
          <div className="py-12 text-center">
            <div className="p-4 rounded-2xl bg-muted/30 inline-block mb-4">
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {searchQuery ? "No URLs match your search." : "No URLs created yet."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!searchQuery && "Create your first shortened URL to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUrls.map((url, index) => (
              <div
                key={url.id}
                className={`p-5 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/40 hover:border-border/50 transition-all animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                data-testid={`row-url-${url.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* URL Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-primary font-mono text-sm bg-primary/10 px-3 py-1.5 rounded-lg font-medium">
                        {url.shortUrl?.replace('https://', '')}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(url.shortUrl!)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg"
                        data-testid={`button-copy-${url.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <a
                        href={url.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground truncate">
                      {truncateUrl(url.originalUrl)}
                    </p>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6">
                      {/* Clicks */}
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold text-foreground" data-testid={`text-clicks-${url.id}`}>
                          {url.clickCount}
                        </p>
                        <p className="text-xs text-muted-foreground">clicks</p>
                      </div>
                      {/* Created */}
                      <div className="text-center min-w-[80px]">
                        <p className="text-sm font-medium">{formatRelativeTime(new Date(url.createdAt!))}</p>
                        <p className="text-xs text-muted-foreground">created</p>
                      </div>
                      {/* Last Clicked */}
                      <div className="text-center min-w-[80px]">
                        <p className="text-sm font-medium">
                          {url.lastClicked ? formatRelativeTime(new Date(url.lastClicked)) : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">last click</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pl-4 border-l border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewAnalytics?.(url)}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                        data-testid={`button-analytics-${url.id}`}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(url.id)}
                        disabled={deleteUrlMutation.isPending}
                        className="h-9 w-9 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        data-testid={`button-delete-${url.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
