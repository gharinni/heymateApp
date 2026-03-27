import api from './api_index';

export const bookingAPI = {
  create:             (data)       => api.post('/bookings', data),
  getById:            (id)         => api.get(`/bookings/${id}`),
  getPendingRequests: ()           => api.get('/bookings/provider/pending'),
  getMyBookings:      ()           => api.get('/bookings/user'),
  accept:             (id, price)  => api.put(`/bookings/${id}/accept`, { price }),
  decline:            (id)         => api.put(`/bookings/${id}/decline`),
  updateStatus:       (id, status) => api.put(`/bookings/${id}/status`, { status }),
  complete:           (id)         => api.put(`/bookings/${id}/complete`),
  cancel:             (id)         => api.put(`/bookings/${id}/cancel`),
};
