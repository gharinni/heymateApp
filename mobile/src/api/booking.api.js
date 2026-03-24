import api from './index';

export const bookingAPI = {

  create: async (data) => {
    const res = await api.post('/requests', data); // ⚠️ using /requests (safer)
    return res.data;
  },

  getMyBookings: async () => {
    const res = await api.get('/requests/my-requests');
    return res.data;
  },

};