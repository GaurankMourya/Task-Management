import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
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

export const authAPI = {
  login: (employeeId: string, password: string) =>
    api.post('/auth/login', { employeeId, password }),
  register: (userData: any) =>
    api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const taskAPI = {
  getTasks: (params?: any) => api.get('/tasks', { params }),
  getTask: (taskId: string) => api.get(`/tasks/${taskId}`),
  getMyTasks: () => api.get('/employees/tasks/my-tasks'),
  createTask: (taskData: any) => api.post('/tasks', taskData),
  updateTask: (taskId: string, taskData: any) => api.put(`/tasks/${taskId}`, taskData),
  // The endpoint for an employee to update their own task status is under the /employees route
  updateTaskStatus: (taskId: string, statusData: any) => api.put(`/employees/tasks/${taskId}/status`, statusData),
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`),
  uploadDocument: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(`/tasks/${taskId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadDocument: (filename: string) => api.get(`/tasks/documents/${filename}`, { responseType: 'blob' }),
};

export const employeeAPI = {
  getEmployees: (params?: any) => api.get('/employees', { params }),
  getEmployee: (employeeId: string) => api.get(`/employees/${employeeId}`),
  updateAvailability: (data: any) => api.put('/employees/availability', data),
  addComment: (taskId: string, comment: string) =>
    api.post(`/employees/tasks/${taskId}/comments`, { comment }),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getEmployees: (params?: any) => api.get('/admin/employees', { params }),
  getEmployeeDetails: (employeeId: string) => api.get(`/admin/employees/${employeeId}`),
  updateEmployeeAvailability: (employeeId: string, data: any) =>
    api.put(`/admin/employees/${employeeId}/availability`, data),
  getAnalytics: (params?: any) => api.get('/admin/analytics', { params }),
};

export default api;
