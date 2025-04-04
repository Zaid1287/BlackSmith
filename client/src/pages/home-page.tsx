import { useAuth } from '@/hooks/use-auth';
import { UserDashboard } from './user-dashboard';
import { AdminDashboard } from './admin-dashboard';

export default function HomePage() {
  const { user } = useAuth();
  
  // Render different dashboard based on user role
  if (user?.isAdmin) {
    return <AdminDashboard />;
  }
  
  return <UserDashboard />;
}
