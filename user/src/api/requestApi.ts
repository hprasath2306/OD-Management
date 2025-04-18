import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RequestType, ODCategory } from '../types/request';

const BASE_URL = 'http://10.0.2.2:3000/api';
// const BASE_URL = 'https://od-management-7t72.onrender.com/api';

const api = axios.create({
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

// Get all requests for the student
export const getStudentRequests = async () => {
  try {
    const response = await api.get('/requests/student');
    return response.data.requests;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch OD requests');
  }
};

// Get all labs
export const getAllLabs = async () => {
  try {
    const response = await api.get('/lab');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch labs');
  }
};

// Get all students
export const getAllStudents = async () => {
  try {
    const response = await api.get('/student');
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch students');
  }
};

// Create a new OD request
export const createODRequest = async (requestData: {
  type: RequestType;
  category: ODCategory;
  needsLab: boolean;
  reason: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  labId?: string;
  students: string[];
}) => {
  try {
    const response = await api.post('/requests', requestData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create OD request');
  }
};

// Get request details
export const getRequestDetails = async (requestId: string) => {
  try {
    console.log("wsgfdsfgds"+requestId)
    const response = await api.get(`/requests/${requestId}`);
    console.log(response.data)
    return response.data;
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'Failed to fetch request details');
  }
};

// Cancel a request
export const cancelRequest = async (requestId: string) => {
  try {
    const response = await api.post(`/requests/${requestId}/cancel`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to cancel request');
  }
}; 