export interface Equipment {
  id: number;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  specifications?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  conditionStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'repair';
  location?: string;
  isAvailable: boolean;
  maintenanceNotes?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentRequest {
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  specifications?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  conditionStatus?: 'excellent' | 'good' | 'fair' | 'poor' | 'repair';
  location?: string;
  isAvailable?: boolean;
  maintenanceNotes?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
}

export interface EquipmentStats {
  total: number;
  available: number;
  allocated: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  repair: number;
}

export interface EquipmentFilters {
  page?: number;
  limit?: number;
  category?: string;
  condition?: string;
  available?: boolean;
  search?: string;
}
