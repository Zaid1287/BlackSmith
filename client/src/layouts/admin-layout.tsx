import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { Link, useLocation } from 'wouter';
import { SharedNavigation } from '@/components/shared-navigation';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  DollarSign, 
  Settings
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

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
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-center mb-2">
            <Logo size="md" showText={true} />
          </div>
        </div>

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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <SharedNavigation />

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}