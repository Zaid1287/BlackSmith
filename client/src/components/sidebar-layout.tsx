import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Truck, 
  Home, 
  BarChart3, 
  Users, 
  ClipboardList, 
  Settings,
  Car,
  Fuel,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location] = useLocation();

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative h-screen flex-col border-r bg-primary text-primary-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center p-4 h-16",
          collapsed ? "justify-center" : "justify-start"
        )}>
          <div className={cn("flex items-center", collapsed ? "flex-col" : "")}>
            <div className={cn(
              "font-serif font-bold flex items-center text-white", 
              collapsed ? "text-2xl" : "text-3xl"
            )}>
              <span>B</span>
              <div className={cn(
                "bg-white", 
                collapsed ? "h-4 w-[1px] my-1" : "h-8 w-[1px] mx-1"
              )}></div>
              <span>S</span>
            </div>
            {!collapsed && (
              <span className="text-xs tracking-wider uppercase ml-1 mt-1 text-primary-foreground/80">
                BlackSmith Traders
              </span>
            )}
          </div>
        </div>

        <Separator className="border-white/20" />

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background text-muted-foreground z-10"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        {/* Navigation */}
        <ScrollArea className="flex-1 pt-4">
          <nav className="flex flex-col gap-1 px-2">
            {user?.isAdmin ? (
              <>
                <div className="nav-item-wrapper">
                <NavItem
                  icon={<Home />}
                  label="Dashboard"
                  href="/"
                  active={location === "/"}
                  collapsed={collapsed}
                />
                </div>
                <div className="nav-item-wrapper">
                <NavItem
                  icon={<Truck />}
                  label="Active Journeys"
                  href="/journeys"
                  active={location === "/journeys"}
                  collapsed={collapsed}
                />
                </div>
                <div className="nav-item-wrapper">
                <NavItem
                  icon={<Users />}
                  label="Manage Users"
                  href="/users"
                  active={location === "/users"}
                  collapsed={collapsed}
                />
                </div>
                <div className="nav-item-wrapper">
                <NavItem
                  icon={<Car />}
                  label="Manage Vehicles"
                  href="/vehicles"
                  active={location === "/vehicles"}
                  collapsed={collapsed}
                />
                </div>
                <div className="nav-item-wrapper">
                <NavItem
                  icon={<Fuel />}
                  label="Fuel Prediction"
                  href="/fuel-prediction"
                  active={location === "/fuel-prediction"}
                  collapsed={collapsed}
                />
                </div>

                {/* Settings tab removed as requested */}
              </>
            ) : (
              <>
                <div className="nav-item-wrapper">
                <NavItem
                  icon={<Home />}
                  label="Dashboard"
                  href="/"
                  active={location === "/"}
                  collapsed={collapsed}
                />
                </div>
                {/* Current Journey tab removed as requested */}
                <div className="nav-item-wrapper">
                <NavItem
                  icon={<ClipboardList />}
                  label="Journey History"
                  href="/history"
                  active={location === "/history"}
                  collapsed={collapsed}
                />
                </div>
              </>
            )}
          </nav>
        </ScrollArea>

        {/* User info & logout */}
        <div className="mt-auto border-t border-white/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
                <p className="text-xs text-primary-foreground/70">
                  {user?.isAdmin ? "Administrator" : "Driver"}
                </p>
              </div>
            )}
          </div>
          
          {/* Language selector */}
          <div className="mb-2">
            <LanguageSelector collapsed={collapsed} />
          </div>
          
          <Button
            variant="outline"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
            className="w-full bg-white text-primary hover:bg-primary-foreground hover:text-primary"
          >
            <LogOut className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
            {!collapsed && "Log out"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}

function NavItem({ icon, label, href, active, collapsed }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-white text-primary" 
            : "text-white hover:bg-primary-foreground/10 hover:text-white",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        <span className={collapsed ? "" : "mr-3"}>{icon}</span>
        {!collapsed && <span>{label}</span>}
      </a>
    </Link>
  );
}