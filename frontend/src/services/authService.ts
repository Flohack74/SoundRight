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

  async updateProfile(profileData: { username: string; email: string; firstName: string; lastName: string }): Promise<User> {
    const response = await apiService.put<{ success: boolean; message: string; user: User }>('/auth/profile', profileData);
    return response.user;
  }
}

export const authService = new AuthService();
