import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UrlShortenRequest, UrlWithAnalytics } from "@shared/schema";

export type ShortenUrlResponse = {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  isAnonymous: boolean;
  remainingUrls?: number;
};

export type AnonymousSession = {
  urlCount: number;
  remainingUrls: number;
};

export function useShortenUrl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UrlShortenRequest): Promise<ShortenUrlResponse> => {
      const response = await apiRequest("POST", "/api/urls/shorten", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "URL shortened successfully!",
        description: `Short URL: ${data.shortUrl}`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/session/anonymous"] });
    },
    onError: (error: any) => {
      if (error.message?.includes("429") || error.message?.includes("ANONYMOUS_LIMIT_REACHED")) {
        toast({
          title: "Limit reached",
          description: "You've created 10 URLs. Please sign up to continue.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to shorten URL",
        variant: "destructive",
      });
    },
  });
}

export function useUserUrls() {
  return useQuery({
    queryKey: ["/api/urls"],
    retry: false,
  }) as { data: UrlWithAnalytics[] | undefined; isLoading: boolean; error: any };
}

export function useUrlAnalytics(urlId: string) {
  return useQuery({
    queryKey: [`/api/urls/${urlId}/analytics`],
    enabled: !!urlId,
    retry: false,
  });
}

export function useDeleteUrl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (urlId: string) => {
      await apiRequest("DELETE", `/api/urls/${urlId}`);
    },
    onSuccess: () => {
      toast({
        title: "URL deleted",
        description: "The URL has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete URL",
        variant: "destructive",
      });
    },
  });
}

export function useAnonymousSession() {
  return useQuery({
    queryKey: ["/api/session/anonymous"],
    retry: false,
  }) as { data: AnonymousSession | undefined; isLoading: boolean };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });
}
