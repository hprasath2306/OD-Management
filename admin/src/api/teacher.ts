import api from './auth';

export interface Teacher {
  id: string;
  userId: string;
  departmentId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateTeacherDto {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
}

export interface UpdateTeacherDto {
  name?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface BulkUploadDto {
  teachers: Array<{
    name: string;
    email: string;
    phone: string;
    departmentId: string;
  }>;
}

export const teacherApi = {
  // Get all teachers
  getAllTeachers: async (): Promise<Teacher[]> => {
    try {
      const response = await api.get<ApiResponse<Teacher[]>>('/teacher');
      console.log('Get teachers response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  // Get teachers by department ID
  getTeachersByDepartment: async (departmentId: string): Promise<Teacher[]> => {
    try {
      // Since there's no direct endpoint for this, we'll fetch all teachers and filter
      const response = await api.get<ApiResponse<Teacher[]>>('/teacher');
      console.log('Get teachers by department response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data.filter(teacher => teacher.departmentId === departmentId);
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching teachers by department:', error);
      throw error;
    }
  },

  // Get teacher by ID
  getTeacher: async (id: string): Promise<Teacher> => {
    try {
      const response = await api.get<ApiResponse<Teacher>>(`/teacher/${id}`);
      console.log('Get teacher response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching teacher:', error);
      throw error;
    }
  },

  // Create teacher
  createTeacher: async (data: CreateTeacherDto): Promise<Teacher> => {
    try {
      const response = await api.post<ApiResponse<Teacher>>('/teacher', data);
      console.log('Create teacher response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  },

  // Update teacher
  updateTeacher: async (id: string, data: UpdateTeacherDto): Promise<Teacher> => {
    try {
      // The error shows that name, email, phone are not directly on the Teacher model
      // We need to structure the data to update the User model through the relation
      const updateData: any = {};
      
      // Only include departmentId if it's provided (this is directly on Teacher model)
      if (data.departmentId) {
        updateData.departmentId = data.departmentId;
      }
      
      // For user-related fields, we need to use the user relation
      if (data.name || data.email || data.phone) {
        updateData.name = data.name;
        updateData.email = data.email;
        updateData.phone = data.phone;
      }
      
      console.log('Sending update data:', updateData);
      
      const response = await api.put<ApiResponse<Teacher>>(`/teacher/${id}`, updateData);
      console.log('Update teacher response:', response.data);
      
      // Invalidate the cache by refetching
      await api.get('/teacher');
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  // Delete teacher
  deleteTeacher: async (id: string): Promise<void> => {
    try {
      await api.delete(`/teacher/${id}`);
      console.log('Teacher deleted successfully');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  },

  // Bulk upload teachers
  bulkUploadTeachers: async (data: BulkUploadDto): Promise<void> => {
    try {
      const response = await api.post<ApiResponse<void>>('/teacher/bulk', data);
      console.log('Bulk upload response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error bulk uploading teachers:', error);
      throw error;
    }
  },
}; 