import { useAuth } from "@/hooks/use-auth";
import { AuthForm } from "@/components/auth-form";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If already logged in but useEffect hasn't redirected yet
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto shadow-xl rounded-xl overflow-hidden">
          {/* Auth form side */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
            <div className="w-full max-w-md">
              <div className="flex flex-col items-center justify-center mb-8">
                {/* BlackSmith Traders Logo */}
                <div className="flex items-center justify-center mb-4">
                  <div className="text-8xl font-serif font-bold flex">
                    <span className="mr-1">B</span>
                    <div className="h-16 w-[1px] bg-black mx-3"></div>
                    <span>S</span>
                  </div>
                </div>
                <h1 className="text-xl tracking-widest uppercase font-light">BLACKSMITH TRADERS</h1>
              </div>
              <AuthForm />
            </div>
          </div>
          
          {/* Hero side */}
          <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/20 to-primary/5 text-center">
            <h1 className="text-4xl font-bold mb-4">Logistics Management System</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              Track vehicles, manage expenses, and monitor journeys in real-time for BlackSmith Traders
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <FeatureCard 
                title="Real-time Tracking" 
                description="Monitor vehicle locations and journey progress on a live map"
              />
              <FeatureCard 
                title="Expense Management" 
                description="Record and categorize all journey expenses to track profitability"
              />
              <FeatureCard 
                title="Financial Overview" 
                description="View profit and loss indicators for each journey in real-time"
              />
              <FeatureCard 
                title="Advanced Reporting" 
                description="Generate detailed reports for completed journeys and expenses"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card text-left shadow-sm">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}