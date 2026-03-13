import api from './index';

export const bookingAPI = {
  // Customer: create a new booking request
  create: (data) => api.post('/api/bookings', data),

  // Provider: accept a booking and quote a price
  accept: (id, price) => api.put(`/api/bookings/${id}/accept`, { price }),

  // Provider: decline a booking
  decline: (id) => api.put(`/api/bookings/${id}/status`, { status: 'CANCELLED' }),

  // Update booking status (IN_PROGRESS, COMPLETED, etc.)
  updateStatus: (id, status) => api.put(`/api/bookings/${id}/status`, { status }),

  // Customer: get their bookings
  getMyBookings: () => api.get('/api/bookings/my'),

  // Provider: get pending requests sent to them
  getPendingRequests: () => api.get('/api/bookings/provider/pending'),

  // Provider: get all their bookings
  getProviderBookings: () => api.get('/api/bookings/provider'),

  // Get a single booking by ID (for status polling)
  getById: (id) => api.get(`/api/bookings/${id}`),
};
