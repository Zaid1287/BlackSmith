import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { Link, useLocation } from 'wouter';
import { SharedNavigation } from '@/components/shared-navigation';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  DollarSign, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
  };
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: '/manage-users', label: 'Manage Users', icon: <Users className="mr-3 h-5 w-5" /> },
    { path: '/journey-history', label: 'Journey History', icon: <Map className="mr-3 h-5 w-5" /> },
    { path: '/finances', label: 'Finances', icon: <DollarSign className="mr-3 h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="mr-3 h-5 w-5" /> },
  ];
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-primary text-white flex flex-col">
        <SharedNavigation>
          <span className="text-sm text-gray-600">Admin Dashboard</span>
        </SharedNavigation>
        
        <nav className="flex-1 pt-4">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center px-4 py-3 hover:bg-opacity-10 hover:bg-white ${
                location === item.path ? 'bg-opacity-20 bg-white' : ''
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-800 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-red-300 hover:text-red-100"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold">
              {navItems.find(item => item.path === location)?.label || 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-500">
              {location === '/' && 'Manage active journeys and monitor fleet status'}
              {location === '/manage-users' && 'Add, edit or remove users in the system'}
              {location === '/journey-history' && 'View completed journeys and their details'}
              {location === '/finances' && 'Monitor financial performance and expenses'}
              {location === '/settings' && 'Configure application settings'}
            </p>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
