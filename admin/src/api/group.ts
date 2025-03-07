import api from './auth';

export interface Group {
  id: string;
  name: string;
  section: string;
  batch: string;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateGroupDto {
  name: string;
  section: string;
  batch: string;
  departmentId: string;
}

export interface UpdateGroupDto {
  name?: string;
  section?: string;
  batch?: string;
  departmentId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const groupApi = {
  // Get all groups
  getAllGroups: async (): Promise<Group[]> => {
    try {
      const response = await api.get<ApiResponse<Group[]>>('/group');
      console.log('Get groups response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  // Get groups by department ID
  getGroupsByDepartment: async (departmentId: string): Promise<Group[]> => {
    try {
      const response = await api.get<ApiResponse<Group[]>>(`/group/department/${departmentId}`);
      console.log('Get groups by department response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching groups by department:', error);
      throw error;
    }
  },

  // Get group by ID
  getGroup: async (id: string): Promise<Group> => {
    try {
      const response = await api.get<ApiResponse<Group>>(`/group/${id}`);
      console.log('Get group response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  },

  // Create group
  createGroup: async (data: CreateGroupDto): Promise<Group> => {
    try {
      const response = await api.post<ApiResponse<Group>>('/group', data);
      console.log('Create group response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  // Update group
  updateGroup: async (id: string, data: UpdateGroupDto): Promise<Group> => {
    try {
      const response = await api.put<ApiResponse<Group>>(`/group/${id}`, data);
      console.log('Update group response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  },

  // Delete group
  deleteGroup: async (id: string): Promise<void> => {
    try {
      await api.delete(`/group/${id}`);
      console.log('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  },
}; 