import { apiService } from './api';
import { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectFilters, 
  ProjectEquipment,
  AllocateEquipmentRequest 
} from '../types/project';

interface ProjectListResponse {
  success: boolean;
  count: number;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Project[];
}

class ProjectService {
  async getProjects(filters?: ProjectFilters): Promise<ProjectListResponse> {
    return apiService.get<ProjectListResponse>('/projects', filters);
  }

  async getProjectById(id: number): Promise<{ success: boolean; data: Project }> {
    return apiService.get<{ success: boolean; data: Project }>(`/projects/${id}`);
  }

  async createProject(project: CreateProjectRequest): Promise<{ success: boolean; data: Project }> {
    return apiService.post<{ success: boolean; data: Project }>('/projects', project);
  }

  async updateProject(id: number, project: UpdateProjectRequest): Promise<{ success: boolean; data: Project }> {
    return apiService.put<{ success: boolean; data: Project }>(`/projects/${id}`, project);
  }

  async deleteProject(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(`/projects/${id}`);
  }

  async getProjectEquipment(id: number): Promise<{ success: boolean; data: ProjectEquipment[] }> {
    return apiService.get<{ success: boolean; data: ProjectEquipment[] }>(`/projects/${id}/equipment`);
  }

  async allocateEquipment(projectId: number, allocation: AllocateEquipmentRequest): Promise<{ success: boolean; data: ProjectEquipment }> {
    return apiService.post<{ success: boolean; data: ProjectEquipment }>(`/projects/${projectId}/equipment`, allocation);
  }

  async returnEquipment(projectId: number, equipmentId: number): Promise<{ success: boolean; message: string }> {
    return apiService.put<{ success: boolean; message: string }>(`/projects/${projectId}/equipment/${equipmentId}`, {});
  }
}

export const projectService = new ProjectService();
