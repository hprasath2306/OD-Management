import api from './auth';
import { Teacher } from './teacher';
import { Designation } from './designation';

export interface TeacherDesignation {
  id: string;
  teacherId: string;
  designationId: string;
  teacher?: Teacher;
  designation?: Designation;
}

export interface CreateTeacherDesignationDto {
  teacherId: string;
  designationId: string;
}

export interface UpdateTeacherDesignationDto {
  designationId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const teacherDesignationApi = {
  // Get designations by teacher ID
  getDesignationsByTeacher: async (teacherId: string): Promise<TeacherDesignation[]> => {
    try {
      const response = await api.get<TeacherDesignation[] | ApiResponse<TeacherDesignation[]>>(`/teacher-designations/teacher/${teacherId}`);
      console.log('Get teacher designations response:', response.data);
      
      // Handle both wrapped and unwrapped responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching teacher designations:', error);
      throw error;
    }
  },

  // Create teacher designation
  createDesignation: async (data: CreateTeacherDesignationDto): Promise<TeacherDesignation> => {
    try {
        console.log(data)
      const response = await api.post<ApiResponse<TeacherDesignation>>('/teacher-designations', data);
      console.log('Create teacher designation response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating teacher designation:', error);
      throw error;
    }
  },

  // Update teacher designation
  updateDesignation: async (id: string, data: UpdateTeacherDesignationDto): Promise<TeacherDesignation> => {
    try {
      const response = await api.put<ApiResponse<TeacherDesignation>>(`/teacher-designations/${id}`, data);
      console.log('Update teacher designation response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating teacher designation:', error);
      throw error;
    }
  },

  // Delete teacher designation
  deleteDesignation: async (id: string): Promise<void> => {
    try {
      await api.delete(`/teacher-designations/${id}`);
      console.log('Teacher designation deleted successfully');
    } catch (error) {
      console.error('Error deleting teacher designation:', error);
      throw error;
    }
  },
}; 