import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RequestType, ODCategory } from '../types/request';

// const BASE_URL = 'http://10.0.2.2:3000/api';
// const BASE_URL = 'https://od-management-7t72.onrender.com/api';
const BASE_URL = 'https://api-od.csepsnacet.in/api';

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
    // console.log(response.data)
    return response.data.requests || [];
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'Failed to fetch OD requests');
  }
};

// Alias for getStudentRequests to fix the API
export const getAllRequests = async () => {
  try {
    const response = await api.get('/requests/student');
    return response.data;  // Keep full response for odStats
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'Failed to fetch OD requests');
  }
};

// Get all requests pending approval for the teacher
export const getApproverRequests = async () => {
  try {
    console.log('Fetching approver requests from /requests/approver...');
    const response = await api.get('/requests/approver');
    console.log('API Response status:', response.status);
    console.log('API Response data structure:', Object.keys(response.data));
    console.log('Requests count:', response.data.requests ? response.data.requests.length : 'No requests property');
    
    // If the API doesn't return an array, handle it gracefully
    if (!response.data.requests) {
      console.error('Invalid response format:', response.data);
      return [];
    }
    
    return response.data.requests || [];
  } catch (error: any) {
    console.error('Error fetching approver requests:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.message || 'Failed to fetch approval requests');
  }
};

// Get all requests for the teacher
export const getTeacherRequests = async () => {
  try {
    const response = await api.get('/requests/group');
    console.log("fedgefdhghghghghghghgfd"+response.data.requests.length)
    return response.data.requests;
  } catch (error: any) {
    console.log(error)
    console.log("kh")
    throw new Error(error.response?.data?.message || 'Failed to fetch teacher requests');
  }
};


// Process an approval (approve or reject)
export const processApproval = async (teacherId: string, data: {
  status: 'APPROVED' | 'REJECTED';
  comments?: string;
  requestId: string;
}) => {
  try {
    console.log(`Making approval API call to /requests/${teacherId}/approve with:`, {
      status: data.status,
      comments: data.comments ? 'Present' : 'Not provided',
      requestId: data.requestId
    });
    
    const response = await api.post(`/requests/${teacherId}/approve`, {
      status: data.status,
      comments: data.comments,
      requestId: data.requestId
    });
    
    console.log('Approval API response:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('Error processing approval:', error);
    console.error('API Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to process this approval');
    } else if (error.response?.status === 404) {
      throw new Error('Approval step not found');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to process approval. Please try again.');
    }
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
  proofOfOD?: string;
}) => {
  try {
    const response = await api.post('/requests', requestData);
    return response.data;
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'Failed to create OD request');
  }
};

// Get request details
export const getRequestDetails = async (requestId: string) => {
  try {
    // console.log("wsgfdsfgds"+requestId)
    const response = await api.get(`/requests/${requestId}`);
    // console.log(response.data)
    return response.data;
  } catch (error: any) {
    console.log(error)
    throw new Error(error.response?.data?.message || 'Failed to fetch request details');
  }
};

// Get a single request by ID (especially for proof documents)
export const getRequestById = async (requestId: string) => {
  try {
    console.log(`Fetching specific request with ID: ${requestId}`);
    const response = await api.get(`/requests/${requestId}/detail`);
    console.log('Request detail response:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching request by ID:', error);
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

// Get approval detail with previous steps
export const getApprovalDetail = async (requestId: string, teacherId: string) => {
  try {
    console.log(`Fetching approval detail for requestId: ${requestId}, teacherId: ${teacherId}`);
    
    // Use our new dedicated endpoint to get request details with approval info
    const response = await api.get(`/requests/${requestId}/detail`);
    
    if (!response.data) {
      console.error('Invalid response format:', response.data);
      throw new Error('Failed to fetch approval details');
    }
    
    console.log(`Successfully fetched request details for ${requestId}, proofOfOD included:`, 
      response.data.proofOfOD ? 'Yes' : 'No');
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching approval detail:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch approval details');
  }
};

// Upload proof of OD directly (without a specific request)
export const uploadProofDirectly = async (imageBase64: string) => {
  try {
    const response = await api.post('/upload/direct', { image: imageBase64 });
    return response.data;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload image');
  }
};

// Upload proof of OD
export const uploadProofOfOD = async (file: string) => {
  try {
    const response = await api.post(`/upload/direct`, { file });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to upload proof of OD');
  }
};

// Get proof of OD
export const getProofOfOD = async (requestId: string) => {
  try {
    const response = await api.get(`/upload/${requestId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get proof of OD');
  }
};