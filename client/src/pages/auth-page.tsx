import { AuthForm } from '@/components/auth-form';
import { Logo } from '@/components/ui/logo';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md">
            <AuthForm />
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="flex-1 bg-gray-900 p-8 flex flex-col justify-center text-white hidden md:flex">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">BlackSmith Traders</h1>
          <h2 className="text-2xl font-semibold mb-6">Logistics Management System</h2>
          
          <p className="mb-6 text-gray-300">
            A comprehensive platform to manage your logistics operations efficiently. Track vehicles, 
            monitor expenses, and optimize your fleet performance in real-time.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Real-time Vehicle Tracking</h3>
                <p className="text-gray-400 text-sm">Monitor your fleet's location and status in real-time using GPS technology.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Financial Management</h3>
                <p className="text-gray-400 text-sm">Track expenses, monitor profits/losses, and optimize operational costs.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium mb-1">Performance Analytics</h3>
                <p className="text-gray-400 text-sm">Gain insights into your operations with detailed analytics and reports.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
