// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
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

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// User API
export const userAPI = {
  getDashboard: () => api.get('/api/dashboard'),
  getAccounts: () => api.get('/api/accounts'),
  getAccountTransactions: (accountId, page = 0, size = 20) => 
    api.get(`/api/accounts/${accountId}/transactions?page=${page}&size=${size}`),
  createAccount: (accountData) => api.post('/api/accounts', accountData),
  createTransaction: (accountId, transactionData) => 
    api.post(`/api/accounts/${accountId}/transactions`, transactionData),
};

// Admin API
export const adminAPI = {
  getUsers: (page = 0, size = 20) => 
    api.get(`/api/admin/users?page=${page}&size=${size}`),
  getUser: (userId) => api.get(`/api/admin/users/${userId}`),
  getAnalytics: () => api.get('/api/admin/analytics/overview'),
  updateUserRoles: (userId, roles) => 
    api.put(`/api/admin/users/${userId}/roles`, { roles }),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
};

export default api; 