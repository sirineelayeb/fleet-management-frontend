// frontend/src/components/Forms/TruckForm.jsx
import React, { useState, useEffect } from 'react';


const TruckForm = ({ onSubmit, initialData, devices, onCancel }) => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: '',
    type: 'normal',
    status: 'available',
    // driver field removed
    device: '',
    vin: '',
    insuranceExpiry: '',
    nextMaintenanceDate: '',
    currentSpeed: '',
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
        status: initialData.status || 'available',
        // driver not copied
        devices: initialData.devices?.map(d => d._id || d) || [],
        vin: initialData.vin || '',
        insuranceExpiry: initialData.insuranceExpiry ? new Date(initialData.insuranceExpiry).toISOString().slice(0, 10) : '',
        nextMaintenanceDate: initialData.nextMaintenanceDate ? new Date(initialData.nextMaintenanceDate).toISOString().slice(0, 10) : '',
        currentSpeed: initialData.currentSpeed || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      status: formData.status,
      vin: formData.vin || undefined,
      insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry) : undefined,
      nextMaintenanceDate: formData.nextMaintenanceDate ? new Date(formData.nextMaintenanceDate) : undefined,
      currentSpeed: formData.currentSpeed ? parseFloat(formData.currentSpeed) : 0,
      devices: formData.devices || [],
    };

    // Single device assignment (optional, keep if needed)
    if (formData.device && formData.device.trim() !== '') {
      cleanData.device = formData.device;
    }

    onSubmit(cleanData);
  };

  const devicesList = Array.isArray(devices) ? devices : (devices?.data || []);
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

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

      {/* Speed Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Speed (km/h)</label>
        <input
          type="number"
          name="currentSpeed"
          value={formData.currentSpeed}
          onChange={handleChange}
          placeholder="0"
          step="1"
          min="0"
          className={inputClass}
        />
        <p className="text-xs text-gray-500 mt-1">
          Default: 0 km/h - Will be updated automatically when truck is moving
        </p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="available">Available</option>
          <option value="in_mission">In Mission</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Important Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
          <input
            type="date"
            name="insuranceExpiry"
            value={formData.insuranceExpiry}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance</label>
          <input
            type="date"
            name="nextMaintenanceDate"
            value={formData.nextMaintenanceDate}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      {/* Devices (Optional – multiple) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Devices (Optional – you can assign multiple)
        </label>
        <select
          name="devices"
          multiple
          value={formData.devices}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData({ ...formData, devices: selectedOptions });
          }}
          className={`${inputClass} h-32`}
        >
          {devicesList.map(device => (
            <option key={device._id} value={device._id}>
              {device.deviceId} – {device.type || 'Device'} ({device.status})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Hold Ctrl (Cmd) to select multiple devices.
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {initialData ? 'Update' : 'Create'} Truck
        </button>
      </div>
    </form>
  );
};

export default TruckForm;