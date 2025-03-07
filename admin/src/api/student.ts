import api from './auth';

export interface Student {
  id: string;
  userId: string;
  groupId: string;
  rollNo: string;
  regNo: string;
  departmentId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  group?: {
    id: string;
    name: string;
    section: string;
    batch: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateStudentDto {
  name: string;
  email: string;
  phone: string;
  rollNo: string;
  regNo: string;
  groupId: string;
  departmentId: string;
}

export interface UpdateStudentDto {
  name?: string;
  email?: string;
  phone?: string;
  rollNo?: string;
  regNo?: string;
  groupId?: string;
  departmentId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const studentApi = {
  // Get all students
  getAllStudents: async (): Promise<Student[]> => {
    try {
      const response = await api.get<ApiResponse<Student[]>>('/student');
      console.log('Get students response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get students by group ID
  getStudentsByGroup: async (groupId: string): Promise<Student[]> => {
    try {
      const response = await api.get<ApiResponse<Student[]>>(`/student/group/${groupId}`);
      console.log('Get students by group response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching students by group:', error);
      throw error;
    }
  },

  // Get student by ID
  getStudent: async (id: string): Promise<Student> => {
    try {
      const response = await api.get<ApiResponse<Student>>(`/student/${id}`);
      console.log('Get student response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  // Create student
  createStudent: async (data: CreateStudentDto): Promise<Student> => {
    try {
      const response = await api.post<ApiResponse<Student>>('/student', data);
      console.log('Create student response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },

  // Update student
  updateStudent: async (id: string, data: UpdateStudentDto): Promise<Student> => {
    try {
      const response = await api.put<ApiResponse<Student>>(`/student/${id}`, data);
      console.log('Update student response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // Delete student
  deleteStudent: async (id: string): Promise<void> => {
    try {
      await api.delete(`/student/${id}`);
      console.log('Student deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },
}; 