import api from './auth';

// Types
export interface Lab {
  id: string;
  name: string;
  departmentId: string;
  inchargeId: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  incharge?: {
    id: string;
    userId: string;
    departmentId: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreateLabDto {
  name: string;
  departmentId: string;
  inchargeId: string;
}

export interface UpdateLabDto {
  name?: string;
  departmentId?: string;
  inchargeId?: string;
}

// API functions
class LabApi {
  async getAllLabs(): Promise<Lab[]> {
    const response = await api.get<Lab[]>('/labs');
    return response.data;
  }

  async getLabById(id: string): Promise<Lab> {
    const response = await api.get<Lab>(`/lab/${id}`);
    return response.data;
  }

  async getLabsByDepartment(departmentId: string): Promise<Lab[]> {
    const response = await api.get<Lab[]>(`/lab/department/${departmentId}`);
    return response.data;
  }

  async getLabsByIncharge(inchargeId: string): Promise<Lab[]> {
    const response = await api.get<Lab[]>(`/lab/incharge/${inchargeId}`);
    return response.data;
  }

  async createLab(data: CreateLabDto): Promise<Lab> {
    const response = await api.post<Lab>('/lab', data);
    return response.data;
  }

  async updateLab(id: string, data: UpdateLabDto): Promise<Lab> {
    const response = await api.put<Lab>(`/lab/${id}`, data);
    return response.data;
  }

  async deleteLab(id: string): Promise<Lab> {
    const response = await api.delete<Lab>(`/lab/${id}`);
    return response.data;
  }
}

export const labApi = new LabApi(); 