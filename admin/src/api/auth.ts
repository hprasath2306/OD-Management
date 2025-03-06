import axios from 'axios';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // Important for cookies
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

export interface AuthResponse {
  user: User;
  session: string;
}

export interface SignupResponse {
  user: string; // Just the user ID
  session: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyOTPResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
  user: User;
}

// Authentication API functions
export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register user
  signup: async (credentials: SignupCredentials): Promise<SignupResponse> => {
    const response = await api.post('/auth/signup', credentials);
    return response.data;
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
      // Handle unauthorized errors (e.g., redirect to login)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 