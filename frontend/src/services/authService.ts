import { apiService } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User, UpdatePasswordRequest } from '../types/auth';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const loginData: LoginRequest = { email, password };
    return apiService.post<AuthResponse>('/auth/login', loginData);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', userData);
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<{ success: boolean; user: User }>('/auth/me');
    return response.user;
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const updateData: UpdatePasswordRequest = { currentPassword, newPassword };
    await apiService.put('/auth/updatepassword', updateData);
  }
}

export const authService = new AuthService();
