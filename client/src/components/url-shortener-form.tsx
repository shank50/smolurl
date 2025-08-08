import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { urlShortenSchema, type UrlShortenRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, ArrowRight, Sparkles } from "lucide-react";
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
      <div className="max-w-3xl mx-auto">
        {/* URL Shortening Form - Soft Card */}
        <div className="soft-card p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* URL Input */}
            <div>
              <Label htmlFor="originalUrl" className="block text-sm font-semibold mb-2.5">
                Paste your long URL
              </Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Link2 className="h-5 w-5" />
                </div>
                <Input
                  id="originalUrl"
                  type="url"
                  placeholder="https://example.com/your-very-long-url-here"
                  {...form.register("originalUrl")}
                  className="h-14 pl-12 text-base rounded-xl border-border/60 bg-background focus:border-primary focus:ring-primary"
                  data-testid="input-original-url"
                />
              </div>
              {form.formState.errors.originalUrl && (
                <p className="text-sm text-destructive mt-2">
                  {form.formState.errors.originalUrl.message}
                </p>
              )}
            </div>

            {/* Custom Slug + Submit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="customSlug" className="block text-sm font-semibold mb-2.5">
                  Custom link <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-border/60 bg-muted/50 text-muted-foreground text-sm font-mono">
                    smolurl/
                  </span>
                  <Input
                    id="customSlug"
                    placeholder="my-custom-link"
                    {...form.register("customSlug")}
                    className="rounded-l-none rounded-r-xl font-mono h-12 border-border/60"
                    data-testid="input-custom-slug"
                  />
                </div>
                {form.formState.errors.customSlug && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.customSlug.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col justify-end">
                <Button
                  type="submit"
                  className="h-12 rounded-xl font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  disabled={shortenMutation.isPending}
                  data-testid="button-shorten"
                >
                  {shortenMutation.isPending ? (
                    "Shortening..."
                  ) : (
                    <>
                      Shorten
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Usage Counter for Anonymous Users */}
          {!isAuthenticated && (
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Free tier usage</span>
                </div>
                <span className="text-sm font-semibold text-primary" data-testid="text-url-count">
                  {urlCount}/10 URLs
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2 mb-3" />
              <p className="text-sm text-muted-foreground">
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="text-primary font-medium hover:underline"
                  data-testid="link-signup"
                >
                  Sign up free
                </button>{" "}
                for unlimited URLs and detailed analytics.
              </p>

              {/* Recent URLs Display */}
              <RecentUrlsDisplay recentUrls={recentUrls} />
            </div>
          )}
        </div>
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
