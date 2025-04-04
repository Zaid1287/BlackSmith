import { createContext, ReactNode, useContext, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Simple mock user type for testing
type User = {
  id: number;
  username: string;
  password: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
};

// Simple mock users for testing
const MOCK_USERS: User[] = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    name: "Admin User",
    isAdmin: true,
    createdAt: new Date(),
  },
  {
    id: 2,
    username: "driver",
    password: "driver123",
    name: "Driver User",
    isAdmin: false,
    createdAt: new Date(),
  }
];

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (data: LoginData) => void;
  logout: () => void;
  register: (data: RegisterData) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: () => {},
  logout: () => {},
  register: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = (credentials: LoginData) => {
    setIsLoading(true);
    setError(null);
    
    // Simple string comparison for authentication
    const foundUser = MOCK_USERS.find(
      (u) => u.username === credentials.username && u.password === credentials.password
    );
    
    if (foundUser) {
      // Simulate async behavior
      setTimeout(() => {
        setUser(foundUser);
        setIsLoading(false);
        toast({
          title: "Login successful",
          description: `Welcome, ${foundUser.name}!`,
        });
      }, 500);
    } else {
      setTimeout(() => {
        setError(new Error("Invalid username or password"));
        setIsLoading(false);
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }, 500);
    }
  };

  const register = (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    // Check if username already exists
    if (MOCK_USERS.some(u => u.username === userData.username)) {
      setError(new Error("Username already exists"));
      setIsLoading(false);
      toast({
        title: "Registration failed",
        description: "Username already exists",
        variant: "destructive",
      });
      return;
    }
    
    // Create new user with proper type
    const newUser: User = {
      ...userData,
      id: MOCK_USERS.length + 1,
      createdAt: new Date()
    };
    
    // Add to mock users array (for this session only)
    MOCK_USERS.push(newUser);
    
    // Simulate async behavior
    setTimeout(() => {
      setUser(newUser);
      setIsLoading(false);
      toast({
        title: "Registration successful",
        description: `Welcome, ${newUser.name}!`,
      });
    }, 500);
  };

  const logout = () => {
    setIsLoading(true);
    
    // Simulate async behavior
    setTimeout(() => {
      setUser(null);
      setIsLoading(false);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    }, 500);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}