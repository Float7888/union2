import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EmailAlertDialogProps {
  filters: {
    states: string[];
    jobTypes: string[];
    keywords: string;
  };
  trigger?: React.ReactNode;
}

export const EmailAlertDialog = ({ filters, trigger }: EmailAlertDialogProps) => {
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createAlertMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await fetch('/api/email-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create email alert');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['email-alerts'] });
      toast({
        title: "Email alert created!",
        description: "You'll be notified when new jobs match your criteria.",
      });
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setEmail("");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create email alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate({
      email,
      states: filters.states,
      jobTypes: filters.jobTypes,
      keywords: filters.keywords || null,
      isActive: true,
    });
  };

  const filterSummary = () => {
    const parts = [];
    if (filters.states.length > 0) {
      parts.push(`${filters.states.length} state${filters.states.length > 1 ? 's' : ''}`);
    }
    if (filters.jobTypes.length > 0) {
      parts.push(`${filters.jobTypes.join(', ')} jobs`);
    }
    if (filters.keywords) {
      parts.push(`containing "${filters.keywords}"`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'all jobs';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Get email alerts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                Email Alert Created!
              </>
            ) : (
              <>
                <Bell className="h-5 w-5" />
                Set Up Job Alerts
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSuccess ? (
              "You'll receive email notifications when new jobs match your criteria."
            ) : (
              "Get notified when new jobs are posted that match your search criteria."
            )}
          </DialogDescription>
        </DialogHeader>
        
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Alert Criteria</Label>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                You'll be notified about: <strong>{filterSummary()}</strong>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createAlertMutation.isPending}
                className="flex-1"
              >
                {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="text-green-600 text-lg font-medium">All set!</div>
            <p className="text-sm text-muted-foreground mt-2">
              Check your email for confirmation.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};