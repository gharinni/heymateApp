import api from './index';

export const providerAPI = {
  getNearby: (lat, lng, service, radius = 5) =>
    api.get('/api/providers/nearby', { params: { lat, lng, service, radius } }),

  updateLocation: (lat, lng) =>
    api.put('/api/providers/location', { lat, lng }),

  toggleOnline: (online) =>
    api.put('/api/providers/online', { online }),

  getProfile: (id) =>
    api.get(`/api/providers/${id}`),

  getStats: () =>
    api.get('/api/providers/stats'),
};
