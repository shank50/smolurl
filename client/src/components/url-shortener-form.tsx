import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { urlShortenSchema, type UrlShortenRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Import } from "lucide-react";
import { useShortenUrl, useAnonymousSession } from "@/hooks/use-url-shortener";
import { LimitModal } from "@/components/modals/limit-modal";
import { AuthModal } from "@/components/modals/auth-modal";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { formatUrl } from "@/lib/url-utils";
import { useRecentAnonymousUrls } from "@/hooks/use-recent-urls";
import { RecentUrlsDisplay } from "@/components/recent-urls-display";

export function UrlShortenerForm() {
  const { isAuthenticated } = useAuth();
  const { data: anonymousSession } = useAnonymousSession();
  const shortenMutation = useShortenUrl();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const { recentUrls, saveRecentUrl } = useRecentAnonymousUrls();

  const form = useForm<UrlShortenRequest>({
    resolver: zodResolver(urlShortenSchema),
    defaultValues: {
      originalUrl: "",
      customSlug: "",
    },
  });

  const onSubmit = async (data: UrlShortenRequest) => {
    const formattedData = {
      ...data,
      originalUrl: formatUrl(data.originalUrl),
      customSlug: data.customSlug || undefined,
    };

    try {
      const result = await shortenMutation.mutateAsync(formattedData);
      
      // Save to recent URLs for anonymous users
      if (!isAuthenticated && result) {
        saveRecentUrl({
          id: result.id,
          shortCode: result.shortCode,
          shortUrl: result.shortUrl,
          originalUrl: result.originalUrl,
          isAnonymous: true,
          createdAt: new Date().toISOString(),
        });
      }
      
      form.reset();
    } catch (error: any) {
      if (error.message?.includes("ANONYMOUS_LIMIT_REACHED") || error.message?.includes("429")) {
        setShowLimitModal(true);
      }
    }
  };

  const handleLimitSignup = () => {
    setShowLimitModal(false);
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleLimitLogin = () => {
    setShowLimitModal(false);
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const urlCount = anonymousSession?.urlCount || 0;
  const remainingUrls = anonymousSession?.remainingUrls || 10;
  const progressPercentage = isAuthenticated ? 0 : (urlCount / 10) * 100;

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Shorten URLs with Style
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create short, memorable links with powerful analytics. No account needed to get started.
          </p>
        </div>

        {/* URL Shortening Form */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="originalUrl" className="block text-sm font-medium mb-2">
                  Original URL
                </Label>
                <Input
                  id="originalUrl"
                  type="url"
                  placeholder="https://example.com/very-long-url-that-needs-shortening"
                  {...form.register("originalUrl")}
                  className="h-12"
                  data-testid="input-original-url"
                />
                {form.formState.errors.originalUrl && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.originalUrl.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customSlug" className="block text-sm font-medium mb-2">
                    Custom Link (Optional)
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm font-mono">
                      smolURL/
                    </span>
                    <Input
                      id="customSlug"
                      placeholder="my-link"
                      {...form.register("customSlug")}
                      className="rounded-l-none font-mono"
                      data-testid="input-custom-slug"
                    />
                  </div>
                  {form.formState.errors.customSlug && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.customSlug.message}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col justify-end">
                  <Button 
                    type="submit" 
                    className="h-12 font-medium"
                    disabled={shortenMutation.isPending}
                    data-testid="button-shorten"
                  >
                    <Import className="mr-2 h-4 w-4" />
                    {shortenMutation.isPending ? "Shortening..." : "Shorten URL"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Usage Counter for Anonymous Users */}
            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-muted/50 rounded-md border border-border" data-testid="usage-counter">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">URLs created today:</span>
                  </div>
                  <span className="text-sm font-medium" data-testid="text-url-count">
                    {urlCount}/10
                  </span>
                </div>
                <Progress value={progressPercentage} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  <button 
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                    }}
                    className="text-primary hover:underline"
                    data-testid="link-signup"
                  >
                    Create an account
                  </button>{" "}
                  for unlimited URLs and analytics.
                </p>
                
                {/* Recent URLs Display */}
                <RecentUrlsDisplay recentUrls={recentUrls} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onSignup={handleLimitSignup}
        onLogin={handleLimitLogin}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={setAuthMode}
      />
    </>
  );
}
