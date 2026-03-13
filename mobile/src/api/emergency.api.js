import api from './index';

export const emergencyAPI = {
  triggerSOS: (lat, lng) =>
    api.post('/api/emergency/sos', { lat, lng }),

  findBloodDonors: (lat, lng, bloodType, radius = 10) =>
    api.get('/api/emergency/blood', { params: { lat, lng, bloodType, radius } }),

  getContacts: () =>
    api.get('/api/emergency/contacts'),

  addContact: (contact) =>
    api.post('/api/emergency/contacts', contact),

  removeContact: (id) =>
    api.delete(`/api/emergency/contacts/${id}`),
};
