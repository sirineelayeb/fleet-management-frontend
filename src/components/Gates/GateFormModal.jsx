// frontend/src/components/Gates/GateFormModal.jsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gateService } from '../../services/gateService';
import { XMarkIcon } from '@heroicons/react/24/outline';

const GateFormModal = ({ gate, onClose, onSuccess }) => {
  const isEditing = !!gate;
  const [formData, setFormData] = useState({
    name: gate?.name || '',
    type: gate?.type || 'entry',
    zone: gate?.zone || 'A',
    location: { lat: gate?.location?.lat || '', lng: gate?.location?.lng || '' },
    radiusMeters: gate?.radiusMeters || 30,
    queueCapacity: gate?.queueCapacity || 30,
    isLoadingZone: gate?.isLoadingZone || false,
    isActive: gate?.isActive !== undefined ? gate.isActive : true,
  });

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? gateService.update(gate._id, data) : gateService.create(data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit Gate' : 'Add Gate'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              >
                <option value="entry">Entry</option>
                <option value="exit">Exit</option>
                {/* <option value="parking">Parking</option>
                <option value="loading">Loading</option>
                <option value="inspection">Inspection</option> */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Zone</label>
              <select
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              >
                <option value="A">Zone A</option>
                <option value="B">Zone B</option>
                <option value="C">Zone C</option>
                <option value="D">Zone D</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.location.lat}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, lat: parseFloat(e.target.value) } })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.location.lng}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, lng: parseFloat(e.target.value) } })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
              <input
                type="number"
                value={formData.radiusMeters}
                onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Queue Capacity</label>
              <input
                type="number"
                value={formData.queueCapacity}
                onChange={(e) => setFormData({ ...formData, queueCapacity: parseInt(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isLoadingZone}
                onChange={(e) => setFormData({ ...formData, isLoadingZone: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Is Loading Zone</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {mutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GateFormModal;