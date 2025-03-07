import api from './auth';

// Role enum matching the backend
export enum Role {
  TUTOR = 'TUTOR',
  YEAR_INCHARGE = 'YEAR_INCHARGE',
  HOD = 'HOD',
  LAB_INCHARGE = 'LAB_INCHARGE'
}

export interface Designation {
  id: string;
  role: Role;
  description: string | null;
}

export interface CreateDesignationDto {
  role: Role;
  description?: string;
}

export interface UpdateDesignationDto {
  role?: Role;
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const designationApi = {
  // Get all designations
  getAllDesignations: async (): Promise<Designation[]> => {
    try {
      const response = await api.get<ApiResponse<Designation[]>>('/designation');
      console.log('Get designations response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching designations:', error);
      throw error;
    }
  },

  // Get designation by ID
  getDesignation: async (id: string): Promise<Designation> => {
    try {
      const response = await api.get<ApiResponse<Designation>>(`/designation/${id}`);
      console.log('Get designation response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching designation:', error);
      throw error;
    }
  },

  // Create designation
  createDesignation: async (data: CreateDesignationDto): Promise<Designation> => {
    try {
      const response = await api.post<ApiResponse<Designation>>('/designation', data);
      console.log('Create designation response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating designation:', error);
      throw error;
    }
  },

  // Update designation
  updateDesignation: async (id: string, data: UpdateDesignationDto): Promise<Designation> => {
    try {
      const response = await api.put<ApiResponse<Designation>>(`/designation/${id}`, data);
      console.log('Update designation response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating designation:', error);
      throw error;
    }
  },

  // Delete designation
  deleteDesignation: async (id: string): Promise<void> => {
    try {
      await api.delete(`/designation/${id}`);
      console.log('Designation deleted successfully');
    } catch (error) {
      console.error('Error deleting designation:', error);
      throw error;
    }
  },
}; 