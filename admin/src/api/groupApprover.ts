import api from './auth';
import { Teacher } from './teacher';
import { Role } from './designation';

export interface GroupApprover {
  id: string;
  groupId: string;
  teacherId: string;
  role: Role;
  teacher: Teacher;
}

export interface CreateGroupApproverDto {
  groupId: string;
  teacherId: string;
  role: Role;
}

export interface UpdateGroupApproverDto {
  teacherId?: string;
  role?: Role;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const groupApproverApi = {
  // Get approvers by group ID
  getApproversByGroup: async (groupId: string): Promise<GroupApprover[]> => {
    try {
      const response = await api.get<ApiResponse<GroupApprover[]>>(`/group-approver/group/${groupId}`);
      console.log('Get group approvers response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching group approvers:', error);
      throw error;
    }
  },

  // Create group approver
  createApprover: async (data: CreateGroupApproverDto): Promise<GroupApprover> => {
    try {
      const response = await api.post<ApiResponse<GroupApprover>>('/group-approver', data);
      console.log('Create group approver response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating group approver:', error);
      throw error;
    }
  },

  // Update group approver
  updateApprover: async (id: string, data: UpdateGroupApproverDto): Promise<GroupApprover> => {
    try {
      const response = await api.put<ApiResponse<GroupApprover>>(`/group-approver/${id}`, data);
      console.log('Update group approver response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating group approver:', error);
      throw error;
    }
  },

  // Delete group approver
  deleteApprover: async (id: string): Promise<void> => {
    try {
      await api.delete(`/group-approver/${id}`);
      console.log('Group approver deleted successfully');
    } catch (error) {
      console.error('Error deleting group approver:', error);
      throw error;
    }
  },
}; 