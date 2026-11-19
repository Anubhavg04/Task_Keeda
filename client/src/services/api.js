import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USER_SESSION_KEY = 'taskflow.user-session';
const USER_SESSION_TTL = 5 * 60 * 1000;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCachedUserSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(USER_SESSION_KEY) || 'null');
    if (!cached?.user || !Number.isFinite(cached.cachedAt) || Date.now() - cached.cachedAt >= USER_SESSION_TTL) {
      window.sessionStorage.removeItem(USER_SESSION_KEY);
      return null;
    }
    return cached.user;
  } catch {
    return null;
  }
};

export const cacheUserSession = (user) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify({ user, cachedAt: Date.now() }));
  } catch {
    // Session caching is best-effort; cookie authentication remains authoritative.
  }
};

export const clearCachedUserSession = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(USER_SESSION_KEY);
  } catch {
    // Session caching is best-effort; cookie authentication remains authoritative.
  }
};

let requestSequence = 0;
let projectsRequest = null;
const clearSlowRequestTimer = (config) => {
  if (!config?._slowRequestTimer) return;
  window.clearTimeout(config._slowRequestTimer);
  window.dispatchEvent(new CustomEvent('taskflow:api-request-settled', {
    detail: { id: config._slowRequestId },
  }));
};

api.interceptors.request.use((config) => {
  config._slowRequestId = `${Date.now()}-${requestSequence += 1}`;
  config._slowRequestTimer = window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('taskflow:api-request-slow', {
      detail: { id: config._slowRequestId },
    }));
  }, 1800);
  return config;
});

api.interceptors.response.use(
  (response) => {
    clearSlowRequestTimer(response.config);
    return response;
  },
  (error) => {
    clearSlowRequestTimer(error.config);
    if (error.response?.status === 401) {
      clearCachedUserSession();
      const url = error.config?.url || '';
      if (!url.startsWith('/auth/login') && !url.startsWith('/auth/register') && !url.startsWith('/auth/logout')) {
        window.dispatchEvent(new Event('taskflow:auth-unauthorized'));
      }
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
  getProjects: () => {
    if (!projectsRequest) {
      projectsRequest = api.get('/projects').finally(() => {
        projectsRequest = null;
      });
    }
    return projectsRequest;
  },
  createProject: (data) => api.post('/projects', data),
  addMember: (projectId, email) => api.post(`/projects/${projectId}/members`, { email }),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
};

export const discussionAPI = {
  getSummaries: () => api.get('/projects/discussion-summaries'),
  getMessages: (projectId, params = {}) => api.get(`/projects/${projectId}/discussions`, { params }),
  createMessage: (projectId, data) => api.post(`/projects/${projectId}/discussions`, data),
  markRead: (projectId, lastMessageId) => api.post(`/projects/${projectId}/discussions/read`, { lastMessageId }),
  updateMessage: (projectId, messageId, content) => api.patch(`/projects/${projectId}/discussions/${messageId}`, { content }),
  deleteMessage: (projectId, messageId) => api.delete(`/projects/${projectId}/discussions/${messageId}`),
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
  getInApp: () => api.get('/notifications/in-app'),
  markInAppRead: (notificationId) => api.patch(`/notifications/in-app/${notificationId}/read`),
  markAllInAppRead: () => api.post('/notifications/in-app/read-all'),
  getSettings: () => api.get('/notifications/settings'),
  saveSubscription: (subscription) => api.post('/notifications/subscriptions', subscription),
  removeSubscription: (endpoint) => api.delete('/notifications/subscriptions', { data: { endpoint } }),
};

export default api;
