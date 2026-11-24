import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USER_SESSION_KEY = 'taskflow.user-session';
const USER_SESSION_TTL = 5 * 60 * 1000;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 75000,
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

let projectsRequest = null;

const RETRYABLE_STATUS = [502, 503, 504];
const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 4000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    const isNetworkError = !error.response && !isTimeout && error.code !== 'ERR_CANCELED';
    const isRetryableStatus = RETRYABLE_STATUS.includes(error.response?.status);
    const isSafeToRetry = config && (config.method === 'get' || config.url === '/auth/login');

    // While the server wakes up, silently retry safe requests (no message shown to the user)
    if (isSafeToRetry && (isNetworkError || isRetryableStatus) && (config._retryCount || 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount || 0) + 1;
      await wait(RETRY_DELAY_MS);
      return api(config);
    }

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
