import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { User, LoginResponse } from '@/stores/authStore';
import type { ImageFile } from '@/stores/dicomStore';

const API_BASE_URL = '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await apiClient.post(
      '/auth/login',
      { username, password }
    );
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.get('/auth/me');
    return response.data.data;
  }
};

export const dicomApi = {
  async getImageList(): Promise<ImageFile[]> {
    const response: AxiosResponse<ApiResponse<ImageFile[]>> = await apiClient.get('/dicom/list');
    return response.data.data;
  },

  async getImageInfo(key: string): Promise<ImageFile> {
    const response: AxiosResponse<ApiResponse<ImageFile>> = await apiClient.get(
      `/dicom/${encodeURIComponent(key)}/info`
    );
    return response.data.data;
  },

  async downloadImage(key: string): Promise<ArrayBuffer> {
    const response = await apiClient.get(
      `/dicom/${encodeURIComponent(key)}/stream`,
      { responseType: 'arraybuffer' }
    );
    return response.data;
  },

  async uploadImage(file: File): Promise<{
    id: string;
    name: string;
    size: number;
    key: string;
    location: string;
    encrypted: boolean;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<ApiResponse<{
      id: string;
      name: string;
      size: number;
      key: string;
      location: string;
      encrypted: boolean;
    }>> = await apiClient.post('/dicom/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data;
  },

  async deleteImage(key: string): Promise<void> {
    await apiClient.delete(`/dicom/${encodeURIComponent(key)}`);
  },

  async getPresignedUrl(key: string, expiresIn?: number): Promise<{ url: string; expiresIn: number }> {
    const params = expiresIn ? { expiresIn } : {};
    const response: AxiosResponse<ApiResponse<{ url: string; expiresIn: number }>> = await apiClient.get(
      `/dicom/${encodeURIComponent(key)}/presigned-url`,
      { params }
    );
    return response.data.data;
  }
};

export default apiClient;
