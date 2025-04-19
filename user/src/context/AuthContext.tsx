import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import * as authApi from '../api/authApi';

type User = {
  id: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, checkOnly?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  verifyForgotPassword: (email: string, otp: string) => Promise<any>;
  resetPassword: (email: string, otp: string, password: string) => Promise<any>;
  verifyEmail: (email: string, otp: string) => Promise<any>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for authentication on app start
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const authenticated = await authApi.isAuthenticated();
        if (authenticated) {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, checkOnly: boolean = false) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      
      // If we're just checking the role (for admin validation), return the response
      if (checkOnly) {
        return response;
      }
      
      // Otherwise set the user and proceed with navigation
      setUser(response.user);
      setIsAuthenticated(true);
      router.replace('/(app)/home');
      return response;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      return await authApi.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const verifyForgotPassword = async (email: string, otp: string) => {
    try {
      return await authApi.verifyForgotPassword(email, otp);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string, otp: string, password: string) => {
    try {
      return await authApi.resetPassword(email, otp, password);
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      const response = await authApi.verifyEmail(email, otp);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      return await authApi.changePassword(oldPassword, newPassword);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        forgotPassword,
        verifyForgotPassword,
        resetPassword,
        verifyEmail,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 