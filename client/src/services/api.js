import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle auth errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show errors for auth check failures
    if (error.config?.url === '/users/user' && error.response?.status === 401) {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  logout: () => api.post('/auth/logout'),
};

export const taskAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getSummary: () => api.get('/tasks/summary'),
  getDeliveryControlTower: (params) => api.get('/tasks/delivery-control-tower', { params }),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  bulkUpdateTasks: (data) => api.patch('/tasks/bulk', data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const projectAPI = {
  getProjects: () => api.get('/projects'),
  createProject: (data) => api.post('/projects', data),
  addMember: (projectId, email) => api.post(`/projects/${projectId}/members`, { email }),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
};

export const noteAPI = {
  getNotes: (params) => api.get('/notes', { params }),
  createNote: (data) => api.post('/notes', data),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`),
};

export const userAPI = {
  getUser: () => api.get('/users/user'),
};

export const notificationAPI = {
  getSettings: () => api.get('/notifications/settings'),
  saveSubscription: (subscription) => api.post('/notifications/subscriptions', subscription),
  removeSubscription: (endpoint) => api.delete('/notifications/subscriptions', { data: { endpoint } }),
};

export default api;
