import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  ExternalLink, 
  BarChart3, 
  Trash2,
  Search,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUserUrls, useDeleteUrl } from "@/hooks/use-url-shortener";
import { copyToClipboard, formatRelativeTime, truncateUrl } from "@/lib/url-utils";
import { useToast } from "@/hooks/use-toast";
import type { UrlWithAnalytics } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Your URLs</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-urls"
              />
            </div>
            <Button onClick={onCreateNew} data-testid="button-new-url">
              <Plus className="mr-2 h-4 w-4" />
              New URL
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {filteredUrls.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No URLs match your search." : "No URLs created yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short URL</TableHead>
                  <TableHead>Original URL</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUrls.map((url) => (
                  <TableRow key={url.id} className="hover:bg-muted/20" data-testid={`row-url-${url.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                          {url.shortUrl?.replace('https://', '')}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(url.shortUrl)}
                          data-testid={`button-copy-${url.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm text-muted-foreground truncate max-w-xs">
                          {truncateUrl(url.originalUrl)}
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
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`text-clicks-${url.id}`}>
                        {url.clickCount} clicks
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(new Date(url.createdAt!))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAnalytics?.(url)}
                          data-testid={`button-analytics-${url.id}`}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(url.id)}
                          disabled={deleteUrlMutation.isPending}
                          data-testid={`button-delete-${url.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
