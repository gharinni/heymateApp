import api from './index';

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  sendOtp: (phone) => api.post(`/api/auth/send-otp?phone=${phone}`),
  verifyOtp: (phone, otp) => api.post(`/api/auth/verify-otp?phone=${phone}&otp=${otp}`),
};

// ─── Provider API ────────────────────────────────────────────────────────────
export const providerApi = {
  getNearby: (lat, lng, service, radius = 5000) =>
    api.get(`/api/providers/nearby?lat=${lat}&lng=${lng}&service=${service}&radius=${radius}`),
  getById: (id) => api.get(`/api/providers/${id}`),
  updateLocation: (lat, lng) => api.put('/api/providers/location', { lat, lng }),
  toggleOnline: (online) => api.put(`/api/providers/status?online=${online}`),
  getMyProfile: () => api.get('/api/providers/my-profile'),
};

// ─── Booking API ─────────────────────────────────────────────────────────────
export const bookingApi = {
  create: (data) => api.post('/api/bookings', data),
  accept: (id, quoteData) => api.put(`/api/bookings/${id}/accept`, quoteData),
  confirmPrice: (id) => api.put(`/api/bookings/${id}/confirm-price`),
  start: (id) => api.put(`/api/bookings/${id}/start`),
  complete: (id) => api.put(`/api/bookings/${id}/complete`),
  cancel: (id, reason) => api.put(`/api/bookings/${id}/cancel?reason=${reason || ''}`),
  getMyBookings: () => api.get('/api/bookings/my-bookings'),
  getProviderRequests: () => api.get('/api/bookings/provider-requests'),
  getById: (id) => api.get(`/api/bookings/${id}`),
};

// ─── Payment API ─────────────────────────────────────────────────────────────
export const paymentApi = {
  initiate: (bookingId) => api.post('/api/payments/initiate', { bookingId }),
  verify: (data) => api.post('/api/payments/verify', data),
  getByBooking: (bookingId) => api.get(`/api/payments/booking/${bookingId}`),
};

// ─── Emergency API ───────────────────────────────────────────────────────────
export const emergencyApi = {
  triggerSOS: (data) => api.post('/api/emergency/sos', data),
  toggleSheSafe: (active, location) =>
    api.post(`/api/emergency/she-safe/${active}`, location),
  findBloodDonors: (bloodType, lat, lng, radiusKm = 10) =>
    api.get(`/api/emergency/blood?bloodType=${bloodType}&lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`),
  registerBloodDonor: (bloodType, lat, lng) =>
    api.post(`/api/emergency/blood/register?bloodType=${bloodType}&lat=${lat}&lng=${lng}`),
  updateEmergencyContacts: (contacts) =>
    api.put('/api/emergency/contacts', contacts),
};

// ─── Review API ──────────────────────────────────────────────────────────────
export const reviewApi = {
  submit: (data) => api.post('/api/reviews', data),
  getProviderReviews: (providerId) => api.get(`/api/reviews/provider/${providerId}`),
};
