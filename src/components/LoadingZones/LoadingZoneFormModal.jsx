import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loadingZoneService } from '../../services/loadingZoneService';
import { MapPinIcon, HomeIcon } from '@heroicons/react/24/outline';
import MapPicker from '../Common/MapPicker';
import Modal from '../Common/Modal'; 

const LoadingZoneFormModal = ({ zone, onClose, onSuccess }) => {
  const isEditing = !!zone;
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    name: zone?.name || '',
    description: zone?.description || '',
    location: { 
      lat: zone?.location?.lat || '', 
      lng: zone?.location?.lng || '',
      placeName: zone?.location?.placeName || ''
    },
    radiusMeters: zone?.radiusMeters || 30,
    status: zone?.status || 'active',
  });

  const mutation = useMutation({
    mutationFn: (data) => isEditing 
      ? loadingZoneService.update(zone._id, data) 
      : loadingZoneService.create(data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.location.lat || !formData.location.lng) {
      alert('Please select a location for the loading zone');
      return;
    }
    
    // Clean up data: remove empty placeName if not provided
    const submitData = { ...formData };
    if (!submitData.location.placeName) delete submitData.location.placeName;
    
    mutation.mutate(submitData);
  };

  const handleLocationSelect = (lat, lng, placeName) => {
    setFormData({ 
      ...formData, 
      location: { lat, lng, placeName: placeName || '' } 
    });
    setShowMap(false);
  };

  return (
    <>
      <Modal 
        isOpen={true} 
        onClose={onClose} 
        title={isEditing ? 'Edit Loading Zone' : 'Add Loading Zone'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., North Loading Bay"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-teal-500 focus:border-teal-500"
              placeholder="Optional description of the loading zone"
            />
          </div>

          {/* Location Selection with Map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            
            {/* Current Location Display */}
            <div className={`rounded-lg p-3 mb-2 ${formData.location.lat && formData.location.lng ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  {formData.location.lat && formData.location.lng ? (
                    <>
                      {/* Show placeName if available */}
                      {formData.location.placeName && (
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <HomeIcon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Address:</span> {formData.location.placeName}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Lat:</span> {formData.location.lat.toFixed(6)} | 
                        <span className="font-medium ml-2">Lng:</span> {formData.location.lng.toFixed(6)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No location selected</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <MapPinIcon className="h-4 w-4" />
                  {formData.location.lat && formData.location.lng ? 'Change Location' : 'Select Location'}
                </button>
              </div>
            </div>

            {/* Manual Entry Option Includes placeName */}
            <details className="text-xs text-gray-500 mt-2">
              <summary className="cursor-pointer">Manual entry</summary>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="block text-xs text-gray-500">Address / Place Name</label>
                  <input
                    type="text"
                    value={formData.location.placeName}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      location: { ...formData.location, placeName: e.target.value } 
                    })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., North Warehouse, Tunis"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.location.lat}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        location: { ...formData.location, lat: parseFloat(e.target.value) } 
                      })}
                      className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 36.8065"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.location.lng}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        location: { ...formData.location, lng: parseFloat(e.target.value) } 
                      })}
                      className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 10.1815"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
            <input
              type="number"
              value={formData.radiusMeters}
              onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })}
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-teal-500 focus:border-teal-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending} 
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Map Picker Modal - expects onSelect to return (lat, lng, placeName) */}
      {showMap && (
        <Modal
          isOpen={showMap}
          onClose={() => setShowMap(false)}
          title="Select Loading Zone Location"
          size="lg"
        >
          <MapPicker
            onSelect={handleLocationSelect}
            onClose={() => setShowMap(false)}
            title="Select Loading Zone Location"
          />
        </Modal>
      )}
    </>
  );
};

export default LoadingZoneFormModal;