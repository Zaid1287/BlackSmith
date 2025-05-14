import { Home, Truck, User, Clock, Menu } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";

export function MobileBottomNav() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );
  
  // Set up a resize listener to show/hide the bottom nav based on screen size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Check initially
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.isAdmin;

  return (
    <>
      {/* Mobile bottom navigation - improved with haptic feedback */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border h-14 flex items-center justify-around z-50 mobile-bottom-nav safe-bottom shadow-md px-1">
        <button 
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center p-1 rounded-lg min-h-[32px] min-w-[50px] transition-all active:scale-90 
            ${location === "/" 
              ? "text-primary bg-primary/15 font-medium" 
              : "text-muted-foreground hover:bg-muted/30"
            } active:bg-primary/10`}
          aria-label="Dashboard"
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        {isAdmin ? (
          <button 
            onClick={() => navigate("/journeys")}
            className={`flex flex-col items-center justify-center p-1 rounded-lg min-h-[32px] min-w-[50px] transition-all active:scale-90
              ${location === "/journeys" 
                ? "text-primary bg-primary/15 font-medium" 
                : "text-muted-foreground hover:bg-muted/30"
              } active:bg-primary/10`}
            aria-label="Journeys"
          >
            <Truck size={20} />
            <span className="text-[10px] mt-0.5">Journeys</span>
          </button>
        ) : (
          <button 
            onClick={() => navigate("/journey-history")}
            className={`flex flex-col items-center justify-center p-1 rounded-lg min-h-[32px] min-w-[50px] transition-all active:scale-90
              ${location === "/journey-history" 
                ? "text-primary bg-primary/15 font-medium" 
                : "text-muted-foreground hover:bg-muted/30"
              } active:bg-primary/10`}
            aria-label="History"
          >
            <Clock size={20} />
            <span className="text-[10px] mt-0.5">History</span>
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={() => navigate("/salaries")}
            className={`flex flex-col items-center justify-center p-1 rounded-lg min-h-[32px] min-w-[50px] transition-all active:scale-90
              ${location === "/salaries" 
                ? "text-primary bg-primary/15 font-medium" 
                : "text-muted-foreground hover:bg-muted/30"
              } active:bg-primary/10`}
            aria-label="Salaries"
          >
            <User size={20} />
            <span className="text-[10px] mt-0.5">Salaries</span>
          </button>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button 
              className="flex flex-col items-center justify-center p-1 rounded-lg min-h-[32px] min-w-[50px] text-muted-foreground hover:bg-muted/30 transition-all active:scale-90 active:bg-primary/10"
              aria-label="More options"
            >
              <Menu size={20} />
              <span className="text-[10px] mt-0.5">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl px-0 safe-bottom border-t-4 border-primary">
            <div className="flex flex-col space-y-3 p-4">
              <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mb-4" />
              
              <h3 className="text-lg font-semibold pb-3 border-b border-muted mb-1 text-primary">More Options</h3>
              
              {isAdmin && (
                <>
                  <button 
                    onClick={() => {
                      navigate("/users");
                      setOpen(false);
                    }}
                    className="flex items-center p-3 hover:bg-muted rounded-lg min-h-[44px] w-full transition-all active:bg-primary/10 active:scale-[0.98]"
                  >
                    <User className="mr-2" size={18} />
                    <span className="text-sm">Manage Users</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigate("/vehicles");
                      setOpen(false);
                    }}
                    className="flex items-center p-3 hover:bg-muted rounded-lg min-h-[44px] w-full transition-all active:bg-primary/10 active:scale-[0.98]"
                  >
                    <Truck className="mr-2" size={18} />
                    <span className="text-sm">Manage Vehicles</span>
                  </button>
                </>
              )}
              
              <button 
                onClick={() => {
                  navigate("/camera");
                  setOpen(false);
                }}
                className="flex items-center p-3 hover:bg-muted rounded-lg min-h-[44px] w-full transition-all active:bg-primary/10 active:scale-[0.98]"
              >
                <svg 
                  className="mr-2" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                <span className="text-sm">Camera</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}