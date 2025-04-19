import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://10.0.2.2:3000/api';
const BASE_URL = 'https://od-management-7t72.onrender.com/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests if available
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await api.post('/auth/forgotPassword', { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to process request');
  }
};

export const verifyForgotPassword = async (email: string, otp: string) => {
  try {
    const response = await api.post('/auth/verifyForgotPassword', { email, otp });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to verify OTP');
  }
};

export const resetPassword = async (email: string, otp: string, password: string) => {
  try {
    const response = await api.post('/auth/resetPassword', { email, otp, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to reset password');
  }
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  try {
    const response = await api.post('/auth/changePassword', { oldPassword, newPassword });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
};

export const verifyEmail = async (email: string, otp: string) => {
  try {
    const response = await api.post('/auth/verifyEmail', { email, otp });
    if (response.data?.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error: any) {
    // console.log(error)
    throw new Error(error.response?.data?.message || 'Failed to verify email');
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    return true;
  } catch (error) {
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  } catch (error) {
    return false;
  }
}; 