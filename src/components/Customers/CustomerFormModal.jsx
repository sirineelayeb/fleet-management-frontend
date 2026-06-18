import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customerService';
import { MapPinIcon } from '@heroicons/react/24/outline';
import MapPicker from '../Common/MapPicker';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';
import PhoneInputField from '../Common/PhoneInputField';
import { isValidPhoneNumber } from 'react-phone-number-input';

const CustomerFormModal = ({ customer, onClose, onSuccess }) => {
  const isEditing = !!customer;
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    location: {
      lat: customer?.location?.lat || '',
      lng: customer?.location?.lng || '',
      placeName: customer?.location?.placeName || ''
    },
    isActive: customer?.isActive !== undefined ? customer.isActive : true,
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => isEditing 
      ? customerService.update(customer._id, data) 
      : customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success(isEditing ? 'Customer updated successfully' : 'Customer created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!formData.location.lat || !formData.location.lng) {
      toast.error('Please provide valid latitude and longitude for the location');
      return;
    }
    mutation.mutate(formData);
  };

  const handleLocationSelect = (lat, lng, placeName) => {
    setFormData({ 
      ...formData, 
      location: { lat, lng, placeName: placeName || `${lat}, ${lng}` }
    });
    // Auto-fill address if empty
    if (!formData.address && placeName) {
      setFormData(prev => ({ ...prev, address: placeName }));
    }
    setShowMap(false);
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Customer' : 'Add Customer'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              placeholder="Customer name"
              autoFocus
            />
          </div>
          <PhoneInputField
            label="Phone"
            required
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val || '' })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              placeholder="Customer address"
            />
          </div>

          {/* Location Section */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Customer Location *
              </label>
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="text-xs bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700 transition-colors flex items-center gap-1"
              >
                <MapPinIcon className="h-3 w-3" />
                Select on Map
              </button>
            </div>
            
            {formData.location.placeName && (
              <div className="mb-2 p-2 bg-teal-50 rounded-lg text-sm text-teal-800">
               {formData.location.placeName}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.lat}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, lat: e.target.value === '' ? '' : parseFloat(e.target.value) } 
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.lng}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, lng: e.target.value === '' ? '' : parseFloat(e.target.value) } 
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending} 
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Map Picker Modal */}
      {showMap && (
        <Modal isOpen={showMap} onClose={() => setShowMap(false)} title="Select Customer Location" size="lg">
          <MapPicker
            onSelect={handleLocationSelect}
            onClose={() => setShowMap(false)}
            title="Select Customer Location"
          />
        </Modal>
      )}
    </>
  );
};

export default CustomerFormModal;