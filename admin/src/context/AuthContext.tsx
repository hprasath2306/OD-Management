import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, User } from '../api/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await authApi.getCurrentUser();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    
    try {
      setIsLoading(true);
      const { user } = await authApi.login({ email, password });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUser(user);
      toast.success('Logged in successfully');
      
      setTimeout(() => {
        navigate('/');
      }, 200);
    } catch (error: any) {
      setUser(null);
      
      if (location.pathname === '/login') {
        setTimeout(() => {
          toast.error(error.response?.data?.message || 'Failed to login');
        }, 300);
      } else {
        navigate('/login', { replace: true });
        setTimeout(() => {
          toast.error(error.response?.data?.message || 'Failed to login');
        }, 500);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
      
      setTimeout(() => {
        setIsAuthenticating(false);
      }, 300);
    }
  };

  // Signup function
  const signup = async (email: string, password: string) => {
    setIsAuthenticating(true);
    
    try {
      setIsLoading(true);
      const { user } = await authApi.signup({ email, password });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUser(user);
      toast.success('Account created successfully');
      
      setTimeout(() => {
        navigate('/');
      }, 200);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
      throw error;
    } finally {
      setIsLoading(false);
      
      setTimeout(() => {
        setIsAuthenticating(false);
      }, 300);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      
      setUser(null);
      
      setTimeout(() => {
        toast.success('Logged out successfully');
        navigate('/login');
      }, 200);
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticating,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 