import api from './auth';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const departmentApi = {
  // Get all departments
  getAllDepartments: async (): Promise<Department[]> => {
    try {
      const response = await api.get<ApiResponse<Department[]>>('/department');
      console.log('Get departments response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get department by ID
  getDepartment: async (id: string): Promise<Department> => {
    try {
      const response = await api.get<ApiResponse<Department>>(`/department/${id}`);
      console.log('Get department response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  },

  // Create department
  createDepartment: async (data: CreateDepartmentDto): Promise<Department> => {
    try {
      const response = await api.post<ApiResponse<Department>>('/department', data);
      console.log('Create department response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  // Update department
  updateDepartment: async (id: string, data: UpdateDepartmentDto): Promise<Department> => {
    try {
      const response = await api.put<ApiResponse<Department>>(`/department/${id}`, data);
      console.log('Update department response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  // Delete department
  deleteDepartment: async (id: string): Promise<void> => {
    try {
      await api.delete(`/department/${id}`);
      console.log('Department deleted successfully');
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },
}; 