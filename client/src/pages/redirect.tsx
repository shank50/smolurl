import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, AlertCircle } from "lucide-react";

interface RedirectProps {
  shortCode: string;
}

export default function Redirect({ shortCode }: RedirectProps) {
  useEffect(() => {
    // This page should rarely be seen as redirects happen server-side
    // But it serves as a fallback for client-side routing
    const timer = setTimeout(() => {
      window.location.href = `/${shortCode}`;
    }, 1000);

    return () => clearTimeout(timer);
  }, [shortCode]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <ExternalLink className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Redirecting...</h1>
          <p className="text-muted-foreground mb-4">
            Taking you to your destination
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
