import api from './auth';

export interface Student {
  id: string;
  userId: string;
  groupId: string;
  rollNo: string;
  regNo: string;
  departmentId: string;
  attendancePercentage: number;
  numberOfOD: number;
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
  attendancePercentage: number;
}

export interface UpdateStudentDto {
  name?: string;
  email?: string;
  phone?: string;
  rollNo?: string;
  regNo?: string;
  groupId?: string;
  departmentId?: string;
  attendancePercentage?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface BulkUploadDto {
  students: Array<{
    name: string;
    email: string;
    phone: string;
    rollNo: string;
    regNo: string;
    attendancePercentage: number;
    departmentId: string;
    groupId: string;
  }>;
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

  // Bulk upload students
  bulkUploadStudents: async (data: BulkUploadDto): Promise<void> => {
    try {
      const response = await api.post<ApiResponse<void>>('/student/bulk', data);
      console.log('Bulk upload response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error bulk uploading students:', error);
      throw error;
    }
  },

  // Reset a student's OD count
  resetStudentODCount: async (studentId: string) => {
    try {
      const response = await api.post(`/student/${studentId}/reset-od-count`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset student OD count');
    }
  },

  // Reset OD counts for all students in a group
  resetGroupODCounts: async (groupId: string) => {
    try {
      const response = await api.post(`/student/group/${groupId}/reset-od-counts`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset group OD counts');
    }
  },
}; 