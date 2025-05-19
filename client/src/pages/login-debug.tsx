import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { User } from '@shared/schema';

export default function LoginDebug() {
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Make direct fetch call to login API
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Login failed: ${errorText || res.statusText}`);
      }

      const userData: User = await res.json();
      
      // Success message
      setMessage(`Login successful! User: ${userData.name}, Role: ${userData.is_admin ? 'Admin' : 'Driver'}`);
      toast({
        title: "Login successful",
        description: `Welcome, ${userData.name}!`,
      });

      // Reload the page to ensure fresh state
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[350px] shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">BlackSmith Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to log in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
          
          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <div>
            <p>Use <strong>newadmin</strong> / <strong>admin123</strong></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}