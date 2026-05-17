import React, { useState, useEffect } from 'react';

const TruckForm = ({ onSubmit, initialData, devices, onCancel }) => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: '',
    type: 'normal',
    vin: '',
    speedLimit: 90,
    devices: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        licensePlate: initialData.licensePlate || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        year: initialData.year || new Date().getFullYear(),
        capacity: initialData.capacity || '',
        type: initialData.type || 'normal',
        vin: initialData.vin || '',
        speedLimit: initialData.speedLimit || 90,
        devices: initialData.devices?.map(d => d._id || d) || [],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDeviceToggle = (deviceId) => {
    setFormData(prev => ({
      ...prev,
      devices: prev.devices.includes(deviceId)
        ? prev.devices.filter(id => id !== deviceId)
        : [...prev.devices, deviceId]
    }));
  };

  const handleSelectAllDevices = () => {
    if (formData.devices.length === devicesList.length) {
      setFormData({ ...formData, devices: [] });
    } else {
      setFormData({ ...formData, devices: devicesList.map(d => d._id) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanData = {
      licensePlate: formData.licensePlate,
      brand: formData.brand,
      model: formData.model,
      year: formData.year ? parseInt(formData.year) : undefined,
      capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
      type: formData.type,
      vin: formData.vin || undefined,
      speedLimit: formData.speedLimit ? parseFloat(formData.speedLimit) : 90,
      devices: formData.devices || [],
    };

    onSubmit(cleanData);
  };

  const devicesList = Array.isArray(devices) ? devices : (devices?.data || []);
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
          <input
            type="text"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            placeholder="1234 TN 5678"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
          <input
            type="text"
            name="vin"
            value={formData.vin}
            onChange={handleChange}
            placeholder="Vehicle ID Number"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className={inputClass}
            min="1990"
            max={new Date().getFullYear() + 1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (tons)</label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="20"
            step="0.1"
            className={inputClass}
          />
        </div>
      </div>

      {/* Truck Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Truck Type</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="normal">Normal</option>
          <option value="refrigerated">Refrigerated</option>
          <option value="fragile">Fragile</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Determines which types of shipments this truck can carry
        </p>
      </div>

      {/* Speed Limit Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Speed Limit (km/h)
        </label>
        <input
          type="number"
          name="speedLimit"
          value={formData.speedLimit}
          onChange={handleChange}
          placeholder="90"
          step="5"
          min="0"
          max="150"
          className={inputClass}
        />
        <p className="text-xs text-gray-500 mt-1">
          Set maximum allowed speed for this truck (default: 90 km/h)
        </p>
      </div>

      {/* Devices - Checkbox List */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Devices (Optional – you can assign multiple)
          </label>
          {devicesList.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllDevices}
              className="text-xs text-teal-600 hover:text-teal-800"
            >
              {formData.devices.length === devicesList.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        
        <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
          {devicesList.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No devices available</p>
              <p className="text-xs mt-1">All devices are already assigned to trucks</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {devicesList.map(device => (
                <label
                  key={device._id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.devices.includes(device._id)}
                    onChange={() => handleDeviceToggle(device._id)}
                    className="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{device.deviceId}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>Status: {device.status || 'active'}</span>
                      {device.batteryLevel !== undefined && (
                        <>
                          <span>•</span>
                          <span>Battery: {device.batteryLevel}%</span>
                        </>
                      )}
                      {device.firmwareVersion && (
                        <>
                          <span>•</span>
                          <span>v{device.firmwareVersion}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {device.lastSeen && (
                    <p className="text-xs text-gray-400">
                      Last seen: {new Date(device.lastSeen).toLocaleDateString()}
                    </p>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          {formData.devices.length} device(s) selected
        </p>
      </div>

      {/* Actions */}
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
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          {initialData ? 'Update' : 'Create'} Truck
        </button>
      </div>
    </form>
  );
};

export default TruckForm;