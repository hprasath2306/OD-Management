import api from './auth';

export type Role = 'TUTOR' | 'YEAR_INCHARGE' | 'HOD' | 'LAB_INCHARGE';

export interface FlowStep {
  id: string;
  sequence: number;
  role: Role;
  flowTemplateId: string;
}

export interface FlowTemplate {
  id: string;
  name: string;
  steps: FlowStep[];
}

export interface CreateFlowTemplateDto {
  name: string;
}

export interface UpdateFlowTemplateDto {
  name?: string;
}

export interface CreateFlowStepDto {
  sequence: number;
  role: Role;
  flowTemplateId: string;
}

export interface UpdateFlowStepDto {
  sequence?: number;
  role?: Role;
  flowTemplateId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const flowTemplateApi = {
  // Get all flow templates
  getAllFlowTemplates: async (): Promise<FlowTemplate[]> => {
    try {
      const response = await api.get<FlowTemplate[] | ApiResponse<FlowTemplate[]>>('/flow-templates');
      
      // Handle both wrapped and unwrapped responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data && typeof response.data === 'object') {
        if ('data' in response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if ('success' in response.data && Array.isArray(response.data)) {
          return response.data;
        }
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching flow templates:', error);
      throw error;
    }
  },

  // Get flow template by ID
  getFlowTemplate: async (id: string): Promise<FlowTemplate> => {
    try {
      const response = await api.get<FlowTemplate | ApiResponse<FlowTemplate>>(`/flow-templates/${id}`);
      
      // Handle both wrapped and unwrapped responses
      if (response.data && typeof response.data === 'object') {
        if ('id' in response.data && 'name' in response.data) {
          return {
            ...response.data,
            steps: Array.isArray(response.data.steps) ? response.data.steps : []
          } as FlowTemplate;
        }
        if ('data' in response.data && response.data.data) {
          const template = response.data.data;
          return {
            ...template,
            steps: Array.isArray(template.steps) ? template.steps : []
          } as FlowTemplate;
        }
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching flow template:', error);
      throw error;
    }
  },

  // Create flow template
  createFlowTemplate: async (data: CreateFlowTemplateDto): Promise<FlowTemplate> => {
    try {
      const response = await api.post<FlowTemplate | ApiResponse<FlowTemplate>>('/flow-templates', data);
      
      if (response.data && typeof response.data === 'object') {
        if ('id' in response.data && 'name' in response.data) {
          return {
            ...response.data,
            steps: Array.isArray(response.data.steps) ? response.data.steps : []
          } as FlowTemplate;
        }
        if ('data' in response.data && response.data.data) {
          const template = response.data.data;
          return {
            ...template,
            steps: Array.isArray(template.steps) ? template.steps : []
          } as FlowTemplate;
        }
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error creating flow template:', error);
      throw error;
    }
  },

  // Update flow template
  updateFlowTemplate: async (id: string, data: UpdateFlowTemplateDto): Promise<FlowTemplate> => {
    try {
      const response = await api.put<FlowTemplate | ApiResponse<FlowTemplate>>(`/flow-templates/${id}`, data);
      
      if (response.data && typeof response.data === 'object') {
        if ('id' in response.data && 'name' in response.data) {
          return {
            ...response.data,
            steps: Array.isArray(response.data.steps) ? response.data.steps : []
          } as FlowTemplate;
        }
        if ('data' in response.data && response.data.data) {
          const template = response.data.data;
          return {
            ...template,
            steps: Array.isArray(template.steps) ? template.steps : []
          } as FlowTemplate;
        }
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error updating flow template:', error);
      throw error;
    }
  },

  // Delete flow template
  deleteFlowTemplate: async (id: string): Promise<void> => {
    try {
      await api.delete(`/flow-templates/${id}`);
    } catch (error) {
      console.error('Error deleting flow template:', error);
      throw error;
    }
  },
};

export const flowStepApi = {
  // Get all flow steps
  getAllFlowSteps: async (): Promise<FlowStep[]> => {
    try {
      const response = await api.get<FlowStep[] | ApiResponse<FlowStep[]>>('/flow-steps');
      
      // Handle both wrapped and unwrapped responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching flow steps:', error);
      throw error;
    }
  },

  // Get flow step by ID
  getFlowStep: async (id: string): Promise<FlowStep> => {
    try {
      const response = await api.get<FlowStep | ApiResponse<FlowStep>>(`/flow-steps/${id}`);
      
      if (response.data && typeof response.data === 'object') {
        if ('id' in response.data && 'sequence' in response.data) {
          return response.data as FlowStep;
        }
        if ('data' in response.data && response.data.data) {
          return response.data.data as FlowStep;
        }
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching flow step:', error);
      throw error;
    }
  },

  // Get flow steps by template
  getFlowStepsByTemplate: async (flowTemplateId: string): Promise<FlowStep[]> => {
    try {
      const response = await api.get<FlowStep[] | ApiResponse<FlowStep[]>>(`/flow-steps/template/${flowTemplateId}`);
      
      // Handle both wrapped and unwrapped responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      console.warn('Unexpected response structure:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching flow steps by template:', error);
      throw error;
    }
  },

  // Create flow step
  createFlowStep: async (data: CreateFlowStepDto): Promise<FlowStep> => {
    try {
      const response = await api.post<FlowStep | ApiResponse<FlowStep>>('/flow-steps', data);
      
      if (response.data && typeof response.data === 'object') {
        if ('id' in response.data && 'sequence' in response.data) {
          return response.data as FlowStep;
        }
        if ('data' in response.data && response.data.data) {
          return response.data.data as FlowStep;
        }
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error creating flow step:', error);
      throw error;
    }
  },

  // Update flow step
  updateFlowStep: async (id: string, data: UpdateFlowStepDto): Promise<FlowStep> => {
    try {
      const response = await api.put<FlowStep | ApiResponse<FlowStep>>(`/flow-steps/${id}`, data);
      
      if (response.data && typeof response.data === 'object') {
        if ('id' in response.data && 'sequence' in response.data) {
          return response.data as FlowStep;
        }
        if ('data' in response.data && response.data.data) {
          return response.data.data as FlowStep;
        }
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error updating flow step:', error);
      throw error;
    }
  },

  // Delete flow step
  deleteFlowStep: async (id: string): Promise<void> => {
    try {
      await api.delete(`/flow-steps/${id}`);
    } catch (error) {
      console.error('Error deleting flow step:', error);
      throw error;
    }
  },
}; 