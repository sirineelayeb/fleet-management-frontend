import api from './api';

export const lprService = {
  // POST /api/lpr/detect
  detect: async (data) => {
    const response = await api.post('/lpr/detect', data);
    return response.data;
  },

  // GET /api/lpr/validate/:plate
  validate: async (plate) => {
    const response = await api.get(`/lpr/validate/${plate}`);
    return response.data;
  },

  // GET /api/lpr/events
  getEvents: async (params) => {
    const response = await api.get('/lpr/events', { params });
    return response.data;
  },

  // GET /api/lpr/stats
  getStats: async () => {
    const response = await api.get('/lpr/stats');
    return response.data;
  },

  // GET /api/lpr/shipment/:shipmentId/events
  getEventsByShipment: async (shipmentId) => {
    const response = await api.get(`/lpr/shipment/${shipmentId}/events`);
    return response.data;
  },
  async deleteEvent(eventId) {
  const response = await api.delete(`/lpr/events/${eventId}`);
  return response.data;
},
  async deleteEventsBulk(filter) {
    const response = await api.delete('/lpr/events', { data: { filter } });
    return response.data;
  },  
  async clearOldEvents(days = 30) {
    const response = await api.delete(`/lpr/events/clear-old?days=${days}`);
    return response.data;
  }
};