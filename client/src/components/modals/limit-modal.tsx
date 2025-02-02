import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  onLogin: () => void;
}

export function LimitModal({ isOpen, onClose, onSignup, onLogin }: LimitModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center" data-testid="limit-modal">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Limit Reached</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-muted-foreground">
            You've created 10 URLs today. Sign up to continue shortening unlimited URLs and get detailed analytics!
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={onSignup}
              className="w-full"
              size="lg"
              data-testid="limit-signup-button"
            >
              Create Free Account
            </Button>
            <Button 
              variant="outline"
              onClick={onLogin}
              className="w-full"
              size="lg"
              data-testid="limit-login-button"
            >
              I Already Have an Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
