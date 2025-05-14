import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Truck, 
  Users, 
  Clock, 
  Menu,
  BadgeIndianRupee,
  Car,
  LogOut,
  Camera,
  ChevronRight,
  User,
  ClipboardList,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/language-selector";
import { PWAStatusWidget, ShareWidget } from "@/components/pwa-widgets";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isAdmin = user?.isAdmin;
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      {/* Top app bar for mobile */}
      <header className="sticky top-0 flex items-center justify-between bg-primary text-white p-3 z-30 shadow-md">
        <div className="flex items-center">
          <button 
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 rounded-full text-white"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="font-serif font-bold flex items-center ml-2">
            <span className="text-xl">B</span>
            <div className="bg-white h-4 w-[1px] mx-1"></div>
            <span className="text-xl">S</span>
            <span className="text-xs tracking-wider uppercase ml-1 mt-1 text-white/90">
              BlackSmith
            </span>
          </div>
        </div>

        {/* User info in header */}
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Side menu drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[300px] p-0 border-r-0">
          <SheetHeader className="bg-primary text-white p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="font-serif font-bold flex items-center">
                <span className="text-2xl">B</span>
                <div className="bg-white h-6 w-[1px] mx-1"></div>
                <span className="text-2xl">S</span>
              </div>
              <SheetClose className="text-white">
                <X size={20} />
              </SheetClose>
            </div>
            <div className="text-xs tracking-wider uppercase mt-1 text-white/90">
              BlackSmith Traders
            </div>
          </SheetHeader>
          
          {/* User profile in drawer */}
          <div className="bg-primary/90 text-white p-4 pb-6 -mt-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white text-primary flex items-center justify-center font-semibold text-lg shadow-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs opacity-80">
                {user?.isAdmin ? "Administrator" : "Driver"}
              </p>
            </div>
          </div>
          
          {/* Navigation links */}
          <nav className="p-2">
            {isAdmin ? (
              <div className="space-y-1">
                <MobileNavLink 
                  href="/" 
                  icon={<Home size={18} />} 
                  label="Dashboard" 
                  active={location === "/"}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileNavLink 
                  href="/journeys" 
                  icon={<Truck size={18} />} 
                  label="Active Journeys" 
                  active={location === "/journeys"}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileNavLink 
                  href="/users" 
                  icon={<Users size={18} />} 
                  label="Manage Users" 
                  active={location === "/users"}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileNavLink 
                  href="/vehicles" 
                  icon={<Car size={18} />} 
                  label="Manage Vehicles" 
                  active={location === "/vehicles"}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileNavLink 
                  href="/salaries" 
                  icon={<BadgeIndianRupee size={18} />} 
                  label="Salaries" 
                  active={location === "/salaries"}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileNavLink 
                  href="/camera" 
                  icon={<Camera size={18} />} 
                  label="Camera" 
                  active={location === "/camera"}
                  onClick={() => setMenuOpen(false)}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <MobileNavLink 
                  href="/" 
                  icon={<Home size={18} />} 
                  label="Dashboard" 
                  active={location === "/"}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileNavLink 
                  href="/journey-history" 
                  icon={<Clock size={18} />} 
                  label="Journey History" 
                  active={location === "/journey-history"}
                  onClick={() => setMenuOpen(false)}
                />
                <MobileNavLink 
                  href="/camera" 
                  icon={<Camera size={18} />} 
                  label="Camera" 
                  active={location === "/camera"}
                  onClick={() => setMenuOpen(false)}
                />
              </div>
            )}
          </nav>
          
          {/* Bottom section with language selector and logout */}
          <div className="mt-auto border-t border-border p-4 absolute bottom-0 left-0 right-0">
            <div className="mb-4">
              <LanguageSelector collapsed={false} />
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full gap-2 bg-primary text-white p-3 rounded-md hover:bg-primary/90 transition-colors"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* PWA widgets */}
      <PWAStatusWidget />
      <ShareWidget />

      {/* Main content */}
      <main className="flex-1 p-3 pb-20">
        {children}
      </main>

      {/* Custom tab bar navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-bottom z-50">
        {isAdmin ? (
          <div className="grid grid-cols-5 h-14">
            <TabButton 
              icon={<Home size={20} />} 
              label="Home" 
              href="/" 
              active={location === "/"} 
            />
            <TabButton 
              icon={<Truck size={20} />} 
              label="Journeys" 
              href="/journeys" 
              active={location === "/journeys"} 
            />
            <TabButton 
              icon={<Camera size={20} />} 
              label="Camera" 
              href="/camera" 
              active={location === "/camera"} 
            />
            <TabButton 
              icon={<BadgeIndianRupee size={20} />} 
              label="Salaries" 
              href="/salaries" 
              active={location === "/salaries"} 
            />
            <TabButton 
              icon={<User size={20} />} 
              label="Profile" 
              href="#" 
              active={false} 
              onClick={() => setMenuOpen(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 h-14">
            <TabButton 
              icon={<Home size={20} />} 
              label="Home" 
              href="/" 
              active={location === "/"} 
            />
            <TabButton 
              icon={<Clock size={20} />} 
              label="History" 
              href="/journey-history" 
              active={location === "/journey-history"} 
            />
            <TabButton 
              icon={<Camera size={20} />} 
              label="Camera" 
              href="/camera" 
              active={location === "/camera"} 
            />
            <TabButton 
              icon={<User size={20} />} 
              label="Profile" 
              href="#" 
              active={false} 
              onClick={() => setMenuOpen(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileNavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function MobileNavLink({ href, icon, label, active, onClick }: MobileNavLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5",
          active 
            ? "bg-primary/10 text-primary font-medium" 
            : "text-foreground hover:bg-muted/50"
        )}
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
        {active && (
          <ChevronRight size={16} className="ml-auto text-primary" />
        )}
      </a>
    </Link>
  );
}

interface TabButtonProps {
  icon: ReactNode;
  label: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}

function TabButton({ icon, label, href, active, onClick }: TabButtonProps) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center p-1",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {icon}
        <span className="text-[10px] mt-0.5">{label}</span>
      </button>
    );
  }
  
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex flex-col items-center justify-center p-1",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {icon}
        <span className="text-[10px] mt-0.5">{label}</span>
      </a>
    </Link>
  );
}