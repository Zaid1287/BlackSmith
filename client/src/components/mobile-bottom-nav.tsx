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
      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border h-18 flex items-center justify-around z-50 mobile-bottom-nav safe-bottom shadow-md px-1">
        <button 
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center p-3 rounded-xl min-h-[56px] min-w-[72px] transition-all active:scale-95 
            ${location === "/" 
              ? "text-primary bg-primary/10 font-medium" 
              : "text-muted-foreground hover:bg-muted/60"
            }`}
          aria-label="Dashboard"
        >
          <Home size={24} className="mb-1" />
          <span className="text-xs font-medium">Dashboard</span>
        </button>

        {isAdmin ? (
          <button 
            onClick={() => navigate("/journeys")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl min-h-[56px] min-w-[72px] transition-all active:scale-95
              ${location === "/journeys" 
                ? "text-primary bg-primary/10 font-medium" 
                : "text-muted-foreground hover:bg-muted/60"
              }`}
            aria-label="Journeys"
          >
            <Truck size={24} className="mb-1" />
            <span className="text-xs font-medium">Journeys</span>
          </button>
        ) : (
          <button 
            onClick={() => navigate("/journey-history")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl min-h-[56px] min-w-[72px] transition-all active:scale-95
              ${location === "/journey-history" 
                ? "text-primary bg-primary/10 font-medium" 
                : "text-muted-foreground hover:bg-muted/60"
              }`}
            aria-label="History"
          >
            <Clock size={24} className="mb-1" />
            <span className="text-xs font-medium">History</span>
          </button>
        )}

        {isAdmin && (
          <button 
            onClick={() => navigate("/salaries")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl min-h-[56px] min-w-[72px] transition-all active:scale-95
              ${location === "/salaries" 
                ? "text-primary bg-primary/10 font-medium" 
                : "text-muted-foreground hover:bg-muted/60"
              }`}
            aria-label="Salaries"
          >
            <User size={24} className="mb-1" />
            <span className="text-xs font-medium">Salaries</span>
          </button>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button 
              className="flex flex-col items-center justify-center p-3 rounded-xl min-h-[56px] min-w-[72px] text-muted-foreground hover:bg-muted/60 transition-all active:scale-95"
              aria-label="More options"
            >
              <Menu size={24} className="mb-1" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl px-0 safe-bottom">
            <div className="flex flex-col space-y-2 p-4">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              
              <h3 className="text-lg font-medium pb-2 border-b">More Options</h3>
              
              {isAdmin && (
                <>
                  <button 
                    onClick={() => {
                      navigate("/users");
                      setOpen(false);
                    }}
                    className="flex items-center p-3 hover:bg-muted rounded-lg min-h-[52px] w-full"
                  >
                    <User className="mr-3" size={20} />
                    <span>Manage Users</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      navigate("/vehicles");
                      setOpen(false);
                    }}
                    className="flex items-center p-3 hover:bg-muted rounded-lg min-h-[52px] w-full"
                  >
                    <Truck className="mr-3" size={20} />
                    <span>Manage Vehicles</span>
                  </button>
                </>
              )}
              
              <button 
                onClick={() => {
                  navigate("/camera");
                  setOpen(false);
                }}
                className="flex items-center p-3 hover:bg-muted rounded-lg min-h-[52px] w-full"
              >
                <svg 
                  className="mr-3" 
                  width="20" 
                  height="20" 
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
                <span>Camera</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}