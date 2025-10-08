import { apiService } from './api';
import { Equipment, CreateEquipmentRequest, EquipmentStats, EquipmentFilters } from '../types/equipment';

interface EquipmentListResponse {
  success: boolean;
  count: number;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Equipment[];
}

interface EquipmentStatsResponse {
  success: boolean;
  data: EquipmentStats;
}

interface CategoriesResponse {
  success: boolean;
  data: string[];
}

class EquipmentService {
  async getEquipment(filters?: EquipmentFilters): Promise<EquipmentListResponse> {
    return apiService.get<EquipmentListResponse>('/equipment', filters);
  }

  async getEquipmentById(id: number): Promise<{ success: boolean; data: Equipment }> {
    return apiService.get<{ success: boolean; data: Equipment }>(`/equipment/${id}`);
  }

  async createEquipment(equipment: CreateEquipmentRequest): Promise<{ success: boolean; data: Equipment }> {
    return apiService.post<{ success: boolean; data: Equipment }>('/equipment', equipment);
  }

  async updateEquipment(id: number, equipment: CreateEquipmentRequest): Promise<{ success: boolean; data: Equipment }> {
    return apiService.put<{ success: boolean; data: Equipment }>(`/equipment/${id}`, equipment);
  }

  async deleteEquipment(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(`/equipment/${id}`);
  }

  async getCategories(): Promise<CategoriesResponse> {
    return apiService.get<CategoriesResponse>('/equipment/meta/categories');
  }

  async getStats(): Promise<EquipmentStatsResponse> {
    return apiService.get<EquipmentStatsResponse>('/equipment/meta/stats');
  }
}

export const equipmentService = new EquipmentService();
