export interface Customer {
  id: number;
  companyName: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  postalCode: string;
  country?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  companyName: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  postalCode: string;
  country?: string;
  taxId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateCustomerRequest {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  active?: string;
  search?: string;
}

