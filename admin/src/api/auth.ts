import axios from 'axios';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  name?: string;
  image?: string;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SignupResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyOTPResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// Authentication API functions
export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return { token, user };
  },

  // Register user
  signup: async (credentials: SignupCredentials): Promise<SignupResponse> => {
    const response = await api.post('/auth/signup', credentials);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return { token, user };
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/currentUser');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
    await api.post('/auth/logout');
  },

  // Forgot password - request OTP
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await api.post('/auth/forgotPassword', { email });
    return response.data;
  },

  // Verify OTP for forgot password
  verifyForgotPasswordOTP: async (email: string, otp: string): Promise<VerifyOTPResponse> => {
    const response = await api.post('/auth/verifyForgotPassword', { email, otp });
    return response.data;
  },

  // Reset password with OTP
  resetPassword: async (email: string, otp: string, password: string): Promise<ResetPasswordResponse> => {
    const response = await api.post('/auth/resetPassword', { email, otp, password });
    return response.data;
  },
};

// Axios interceptor for handling authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 