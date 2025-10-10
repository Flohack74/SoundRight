import { apiService } from './api';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerFilters } from '../types/customer';

interface CustomerListResponse {
  success: boolean;
  count: number;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Customer[];
}

class CustomerService {
  async getCustomers(filters?: CustomerFilters): Promise<CustomerListResponse> {
    return apiService.get<CustomerListResponse>('/customers', filters);
  }

  async getCustomerById(id: number): Promise<{ success: boolean; data: Customer }> {
    return apiService.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
  }

  async createCustomer(customer: CreateCustomerRequest): Promise<{ success: boolean; data: Customer }> {
    return apiService.post<{ success: boolean; data: Customer }>('/customers', customer);
  }

  async updateCustomer(id: number, customer: UpdateCustomerRequest): Promise<{ success: boolean; data: Customer }> {
    return apiService.put<{ success: boolean; data: Customer }>(`/customers/${id}`, customer);
  }

  async deleteCustomer(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(`/customers/${id}`);
  }
}

export const customerService = new CustomerService();

