import { apiService } from './api';
import { User, CreateUserRequest, UpdateUserRequest, UserFilters } from '../types/user';

interface UserListResponse {
  success: boolean;
  count: number;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  data: User[];
}

class UserService {
  async getUsers(filters?: UserFilters): Promise<UserListResponse> {
    return apiService.get<UserListResponse>('/users', filters);
  }

  async getUserById(id: number): Promise<{ success: boolean; data: User }> {
    return apiService.get<{ success: boolean; data: User }>(`/users/${id}`);
  }

  async createUser(user: CreateUserRequest): Promise<{ success: boolean; message: string; user: User }> {
    return apiService.post<{ success: boolean; message: string; user: User }>('/auth/register', user);
  }

  async updateUser(id: number, user: UpdateUserRequest): Promise<{ success: boolean; data: User }> {
    return apiService.put<{ success: boolean; data: User }>(`/users/${id}`, user);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(`/users/${id}`);
  }
}

export const userService = new UserService();

