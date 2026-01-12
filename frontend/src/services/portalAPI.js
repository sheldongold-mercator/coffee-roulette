import api from './api';

/**
 * User Portal API - Endpoints for regular users (not admin)
 */
export const portalAPI = {
  // Profile
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),

  // Opt-in/out
  optIn: () => api.post('/users/opt-in'),
  optOut: () => api.post('/users/opt-out'),
  setAvailability: (availableFrom) => api.post('/users/availability', { availableFrom }),

  // Pairings
  getCurrentPairing: () => api.get('/users/pairings/current'),
  getPairingHistory: (params) => api.get('/users/pairings', { params }),

  // Meeting actions
  confirmMeeting: (pairingId) => api.post(`/users/pairings/${pairingId}/confirm`),
  submitFeedback: (pairingId, data) => api.post(`/users/pairings/${pairingId}/feedback`, data),
};

export default portalAPI;
