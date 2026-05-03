// frontend/src/components/Forms/DeviceForm.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { truckService } from '../../services/truckService';
import { TruckIcon } from '@heroicons/react/24/outline';

const DeviceForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    deviceId: '',
    truckId: ''
  });

  const { data: allTrucksData } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000 }),
    retry: 1
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        deviceId: initialData.deviceId || '',
        truckId: initialData.truck?._id || initialData.truckId || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const trucks = allTrucksData?.data || [];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Device ID *
        </label>
        <input
          type="text"
          name="deviceId"
          value={formData.deviceId}
          onChange={handleChange}
          placeholder="e.g., ESP32_001"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Unique identifier for the device</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <TruckIcon className="h-4 w-4 text-gray-500" />
          Assign to Truck (Optional)
        </label>
        <select
          name="truckId"
          value={formData.truckId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Unassigned —</option>
          {trucks.map((truck) => (
            <option key={truck._id} value={truck._id}>
              {truck.licensePlate} {truck.model ? `· ${truck.model}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {initialData ? 'Update' : 'Register'} Device
        </button>
      </div>
    </form>
  );
};

export default DeviceForm;