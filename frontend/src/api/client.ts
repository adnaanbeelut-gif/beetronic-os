import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const { data } = await this.instance.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.instance.post('/auth/login', { email, password });
    return data;
  }

  async logout() {
    await this.instance.post('/auth/logout');
  }

  async getProfile() {
    const { data } = await this.instance.get('/auth/profile');
    return data;
  }

  async setup2FA() {
    const { data } = await this.instance.post('/auth/setup-2fa');
    return data;
  }

  async verify2FA(secret: string, token: string) {
    const { data } = await this.instance.post('/auth/verify-2fa', { secret, token });
    return data;
  }

  async refreshToken(refreshToken: string) {
    const { data } = await this.instance.post('/auth/refresh-token', { refreshToken });
    return data;
  }

  async getUsers() {
    const { data } = await this.instance.get('/users');
    return data;
  }

  async createUser(email: string, password: string, firstName: string, lastName: string) {
    const { data } = await this.instance.post('/admin/users', {
      email,
      password,
      firstName,
      lastName,
    });
    return data;
  }

  async deleteUser(userId: string) {
    const { data } = await this.instance.delete(`/admin/users/${userId}`);
    return data;
  }

  async getUserDetails(userId: string) {
    const { data } = await this.instance.get(`/admin/users/${userId}`);
    return data;
  }

  async updateUser(userId: string, updates: any) {
    const { data } = await this.instance.put(`/admin/users/${userId}`, updates);
    return data;
  }

  async getSessions() {
    const { data } = await this.instance.get('/sessions/my-sessions');
    return data;
  }

  async revokeSession(sessionId: string) {
    const { data } = await this.instance.delete(`/sessions/${sessionId}`);
    return data;
  }

  async revokeAllOtherSessions() {
    const { data } = await this.instance.post('/sessions/revoke-all-other-sessions');
    return data;
  }

  async getApiTokens() {
    const { data } = await this.instance.get('/tokens/api-tokens');
    return data;
  }

  async createApiToken(name: string, expiresIn: string) {
    const { data } = await this.instance.post('/tokens/api-tokens', { name, expiresIn });
    return data;
  }

  async revokeApiToken(tokenId: string) {
    const { data } = await this.instance.delete(`/tokens/api-tokens/${tokenId}`);
    return data;
  }
}

export const apiClient = new ApiClient();
