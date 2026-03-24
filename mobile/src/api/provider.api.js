import api from './index';

export const providerAPI = {

  // ✅ GET NEARBY PROVIDERS
  getNearby: (lat, lng, service, radius = 5) =>
    api.get('/providers/nearby', {
      params: { lat, lng, service, radius },
    }),

  // ✅ UPDATE LOCATION
  updateLocation: (lat, lng) =>
    api.put('/providers/location', { lat, lng }),

  // ✅ TOGGLE ONLINE STATUS
  toggleOnline: (online) =>
    api.put('/providers/online', { online }),

  // ✅ GET PROVIDER PROFILE
  getProfile: (id) =>
    api.get(`/providers/${id}`),

  // ✅ GET PROVIDER STATS
  getStats: () =>
    api.get('/providers/stats'),

};