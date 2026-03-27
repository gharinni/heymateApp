import api from './api_index';

export const providerAPI = {
  getNearby:    (lat, lng, svc, radius) =>
    api.get(`/providers/nearby?latitude=${lat}&longitude=${lng}&category=${svc || ''}&radius=${radius || 10}`),
  getStats:     ()        => api.get('/providers/stats'),
  toggleOnline: (online)  => api.put('/providers/online', { online }),
  updateProfile:(data)    => api.put('/providers/profile', data),
  getProfile:   ()        => api.get('/providers/profile'),
};
