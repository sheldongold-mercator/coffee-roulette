import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('jwtToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (microsoftToken) =>
    api.post('/auth/login', { accessToken: microsoftToken }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/admin/analytics/overview'),
  getParticipationTrends: (months = 6) =>
    api.get(`/admin/analytics/trends/participation?months=${months}`),
  getCompletionTrends: (months = 6) =>
    api.get(`/admin/analytics/trends/completion?months=${months}`),
  getDepartmentStats: () => api.get('/admin/analytics/departments'),
  getDepartmentBreakdown: () => api.get('/admin/analytics/departments/breakdown'),
  getFeedbackStats: () => api.get('/admin/analytics/feedback'),
  getCrossDepartmentStats: () => api.get('/admin/analytics/cross-department'),
  getCrossSeniorityStats: () => api.get('/admin/analytics/cross-seniority'),
  getSatisfactionTrends: (months = 6) =>
    api.get(`/admin/analytics/trends/satisfaction?months=${months}`),
  getEngagementLeaderboard: (limit = 10) =>
    api.get(`/admin/analytics/leaderboard?limit=${limit}`),
  getRecentActivity: (limit = 20) =>
    api.get(`/admin/analytics/activity?limit=${limit}`),
  exportUsers: () => api.get('/admin/analytics/export/users', { responseType: 'blob' }),
  exportPairings: () => api.get('/admin/analytics/export/pairings', { responseType: 'blob' }),
  exportFeedback: () => api.get('/admin/analytics/export/feedback', { responseType: 'blob' }),
  exportSummary: () => api.get('/admin/analytics/export/summary'),
};

// User Management APIs
export const userAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  syncUsers: () => api.post('/admin/users/sync'),
  getUserStats: () => api.get('/admin/users/stats'),
  bulkAction: (userIds, action, data) => api.post('/admin/users/bulk', { userIds, action, data }),
  // Exclusion APIs
  getUserExclusions: (userId) => api.get(`/admin/users/${userId}/exclusions`),
  addExclusion: (userId, excludedUserId, reason) =>
    api.post(`/admin/users/${userId}/exclusions`, { excludedUserId, reason }),
  removeExclusion: (exclusionId) => api.delete(`/admin/users/exclusions/${exclusionId}`),
};

// Department APIs
export const departmentAPI = {
  getDepartments: () => api.get('/admin/departments'),
  getDepartmentById: (id) => api.get(`/admin/departments/${id}`),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  enableDepartment: (id) => api.post(`/admin/departments/${id}/enable`),
  disableDepartment: (id) => api.post(`/admin/departments/${id}/disable`),
  getDepartmentStats: (id) => api.get(`/admin/departments/${id}/stats`),
};

// Matching APIs
export const matchingAPI = {
  getRounds: (params) => api.get('/admin/matching/rounds', { params }),
  getRoundById: (roundId) => api.get(`/admin/matching/rounds/${roundId}`),
  previewMatching: () => api.get('/admin/matching/preview'),
  runMatching: (data) => api.post('/admin/matching/run', data),
  getSettings: () => api.get('/admin/matching/settings'),
  updateSettings: (settings) => api.put('/admin/matching/settings', { settings }),
  getEligibleCount: () => api.get('/admin/matching/eligible'),
  // Schedule management
  getSchedule: () => api.get('/admin/matching/schedule'),
  updateSchedule: (data) => api.put('/admin/matching/schedule', data),
  toggleAutoSchedule: (enabled) => api.post('/admin/matching/schedule/toggle', { enabled }),
  // Manual matching with filters
  runManualMatching: (data) => api.post('/admin/matching/run-manual', data),
  previewWithFilters: (data) => api.post('/admin/matching/preview-filtered', data),
  // Reminder notifications
  sendRoundReminders: (roundId) => api.post(`/admin/matching/rounds/${roundId}/send-reminders`),
  sendAllReminders: () => api.post('/admin/matching/send-all-reminders'),
};

// Settings APIs
export const settingsAPI = {
  getAllSettings: () => api.get('/admin/settings'),
  getSettingsByCategory: (category) => api.get(`/admin/settings/category/${category}`),
  updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),
  updateMultipleSettings: (settings) => api.put('/admin/settings', { settings }),
  getJobStatus: () => api.get('/admin/settings/jobs/status'),
  triggerJob: (jobKey) => api.post(`/admin/settings/jobs/${jobKey}/trigger`),
};

// Template APIs
export const templateAPI = {
  getTemplates: () => api.get('/admin/templates'),
  getTemplate: (type, channel) => api.get(`/admin/templates/${type}/${channel}`),
  updateTemplate: (type, channel, data) => api.put(`/admin/templates/${type}/${channel}`, data),
  previewTemplate: (type, channel, data) => api.post(`/admin/templates/${type}/${channel}/preview`, data),
  restoreDefault: (type, channel) => api.post(`/admin/templates/${type}/${channel}/restore`),
  getVariables: (type) => api.get(`/admin/templates/variables/${type}`),
};

export default api;
