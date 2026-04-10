import api from './api';

export const goodsService = {
  // Get goods by shipment
  getByShipment: async (shipmentId) => {
    const response = await api.get(`/goods/shipments/${shipmentId}/goods`);
    return response.data;
  },
  
  // Add goods to shipment
  create: async (shipmentId, data) => {
    const response = await api.post(`/goods/shipments/${shipmentId}/goods`, data);
    return response.data;
  },
  
  // Update goods
  update: async (id, data) => {
    const response = await api.put(`/goods/${id}`, data);
    return response.data;
  },
  
  // Delete goods
  delete: async (shipmentId, goodsId) => {
    const response = await api.delete(`/goods/shipments/${shipmentId}/goods/${goodsId}`);
    return response.data;
  }
};
