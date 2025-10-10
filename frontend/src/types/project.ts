export interface Project {
  id: number;
  name: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface ProjectEquipment {
  id: number;
  projectId: number;
  equipmentId: number;
  quantity: number;
  notes?: string;
  allocatedDate: string;
  returnedDate?: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  conditionStatus: string;
  location: string;
}

export interface AllocateEquipmentRequest {
  equipmentId: number;
  quantity: number;
  notes?: string;
}
