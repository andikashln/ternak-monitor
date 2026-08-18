import axios, { AxiosInstance } from 'axios';

// Relative URL keeps API requests working from localhost and other devices on the LAN.
const API_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'ternak_current_user';

export const authSession = {
  getToken: () => localStorage.getItem(AUTH_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = authSession.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid. Let the application decide how to present login.
      authSession.clear();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
};

// Livestock API
export const livestockAPI = {
  getAll: () => apiClient.get('/livestock'),
  getById: (id: string) => apiClient.get(`/livestock/${id}`),
  create: (data: any) => apiClient.post('/livestock', data),
  update: (id: string, data: any) => apiClient.put(`/livestock/${id}`, data),
  delete: (id: string) => apiClient.delete(`/livestock/${id}`),
};

export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  create: (data: unknown) => apiClient.post('/users', data),
  update: (id: string, data: unknown) => apiClient.put(`/users/${id}`, data),
  resetPassword: (id: string, password: string) => apiClient.post(`/users/${id}/reset-password`, { password }),
};

export const aiAPI = {
  createOwnerDailyBrief: (data: unknown) => apiClient.post('/owner-daily-brief', data),
};

// Export for other components
export default apiClient;
