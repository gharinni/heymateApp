import { Platform } from 'react-native';

export const API_URL = 'https://distinguished-elegance-production.up.railway.app/api';
export const BACKEND = 'https://distinguished-elegance-production.up.railway.app/api';

const getToken = async () => {
  try {
    if (Platform.OS === 'web') return localStorage.getItem('token');
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem('token');
  } catch { return null; }
};

const apiFetch = async (endpoint, method = 'GET', body = null) => {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${API_URL}${endpoint}`, opts);
  const data = await res.json();
  return { data, status: res.status };
};

const api = {
  get:    (url)         => apiFetch(url, 'GET'),
  post:   (url, body)   => apiFetch(url, 'POST', body),
  put:    (url, body)   => apiFetch(url, 'PUT', body),
  delete: (url)         => apiFetch(url, 'DELETE'),
  patch:  (url, body)   => apiFetch(url, 'PATCH', body),
};

export default api;
