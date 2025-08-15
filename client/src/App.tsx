import { Switch, Route } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Loader2, Zap } from "lucide-react";

import { Header } from "@/components/layout/header";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/use-auth";
import type { UrlWithAnalytics } from "@shared/schema";

type View = 'home' | 'dashboard' | 'analytics';

// Warmup screen component
function WarmupScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center animate-fade-in-up">
        <div className="relative mb-6">
          <div className="p-4 rounded-2xl bg-primary/10 inline-block">
            <Zap className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3 text-xl font-semibold text-foreground mb-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Firing Up!
        </div>
        <p className="text-sm text-muted-foreground">Warming up the database...</p>
      </div>
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedUrl, setSelectedUrl] = useState<UrlWithAnalytics | null>(null);
  const [showUrlForm, setShowUrlForm] = useState(false);

  // Warm up the database on app load
  const { isLoading: dbLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Database warming up');
      return res.json();
    },
    retry: 5,
    retryDelay: 1000,
    staleTime: Infinity,
  });

  const handleViewAnalytics = (url: UrlWithAnalytics) => {
    setSelectedUrl(url);
    setCurrentView('analytics');
  };

  const handleBackToDashboard = () => {
    setSelectedUrl(null);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: View) => {
    if (view === 'dashboard' && !isAuthenticated) {
      setCurrentView('home');
      return;
    }
    setCurrentView(view);
    setShowUrlForm(false);
  };

  // Show warmup screen while database is loading
  if (dbLoading && !isError) {
    return <WarmupScreen />;
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to appropriate view based on auth state
  const defaultView = isAuthenticated ? 'dashboard' : 'home';
  const activeView = currentView === 'home' && isAuthenticated ? 'dashboard' : currentView;

  return (
    <Switch>
      {/* Main app route */}
      <Route path="/">
        <div className="min-h-screen bg-background">
          <Header
            onNavigate={handleNavigate}
            currentView={activeView}
          />

          {activeView === 'analytics' && selectedUrl ? (
            <Analytics
              url={selectedUrl}
              onBack={handleBackToDashboard}
            />
          ) : activeView === 'dashboard' && isAuthenticated ? (
            <Dashboard
              onViewAnalytics={handleViewAnalytics}
              showUrlForm={showUrlForm}
              onToggleUrlForm={() => setShowUrlForm(!showUrlForm)}
            />
          ) : (
            <Home />
          )}
        </div>
      </Route>

      {/* 404 fallback */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
