import { Platform } from 'react-native';

// ✅ YOUR RAILWAY BACKEND
export const API_URL = 'https://distinguished-elegance-production.up.railway.app/api';

// ── TOKEN HANDLING ─────────────────────────────────────
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('token');
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      return await AS.getItem('token');
    }
  } catch (e) {
    console.log('Token error:', e);
    return null;
  }
};

// ── CORE API FUNCTION (FIXED) ──────────────────────────
const apiFetch = async (endpoint, method = 'GET', body = null) => {
  try {
    const token = await getToken();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    // ✅ VERY IMPORTANT FIX
    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }

    return data;

  } catch (error) {
    console.log(`API ERROR (${endpoint}):`, error.message);
    throw error;
  }
};

// ── AUTH ──────────────────────────────────────────────
export const authAPI = {
  register:      (data) => apiFetch('/auth/register', 'POST', data),
  login:         (data) => apiFetch('/auth/login', 'POST', data),
  getProfile:    ()     => apiFetch('/auth/profile'),
  updateProfile: (data) => apiFetch('/auth/profile', 'PUT', data),
};

// ── REQUESTS ──────────────────────────────────────────
export const requestAPI = {
  create:        (data)        => apiFetch('/requests', 'POST', data),
  getMyRequests: ()            => apiFetch('/requests/my-requests'),
  getNearby:     (lat, lng, r) => apiFetch(`/requests/nearby?latitude=${lat}&longitude=${lng}&radius=${r}`),
  getById:       (id)          => apiFetch(`/requests/${id}`),
  makeOffer:     (id, data)    => apiFetch(`/requests/${id}/offer`, 'POST', data),
  acceptOffer:   (id, data)    => apiFetch(`/requests/${id}/accept-offer`, 'POST', data),
  complete:      (id)          => apiFetch(`/requests/${id}/complete`, 'PUT'),
  cancel:        (id, data)    => apiFetch(`/requests/${id}/cancel`, 'PUT', data),
};

// ── PROVIDERS ─────────────────────────────────────────
export const providerAPI = {
  register:       (data)          => apiFetch('/providers/register', 'POST', data),
  getNearby:      (cat, lat, lng) => apiFetch(`/providers/nearby?category=${cat}&latitude=${lat}&longitude=${lng}&radius=30`),
  getMyProfile:   ()              => apiFetch('/providers/profile'),
  updateProfile:  (data)          => apiFetch('/providers/profile', 'PUT', data),
  toggleAvailable:(data)          => apiFetch('/providers/availability', 'PUT', data),
};

// ── REVIEWS ───────────────────────────────────────────
export const reviewAPI = {
  submit:      (data) => apiFetch('/reviews', 'POST', data),
  getProvider: (id)   => apiFetch(`/reviews/provider/${id}`),
};

// ── BOOKINGS (YOU NEED THIS) 🚨 ────────────────────────
export const bookingAPI = {
  create: (data) => apiFetch('/bookings', 'POST', data),
};

// ── EXPORT ALL ────────────────────────────────────────
export default {
  authAPI,
  requestAPI,
  providerAPI,
  reviewAPI,
  bookingAPI,
  API_URL,
};