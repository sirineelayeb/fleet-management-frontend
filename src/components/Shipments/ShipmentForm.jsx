import React, { useState, useEffect } from 'react';
import { truckService } from '../../services/truckService';
import toast from 'react-hot-toast';

const ShipmentForm = ({ onSubmit, initialData, onCancel }) => {
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [loadingTrucks, setLoadingTrucks] = useState(true);
  const [formData, setFormData] = useState({
    description: '',
    origin: '',
    destination: '',
    originCoordinates: { lat: '', lng: '' },
    destinationCoordinates: { lat: '', lng: '' },
    weightKg: '',
    shipmentType: 'normal',
    status: 'pending',
    truck: '',
    customer: { name: '', phone: '' },
    isPriority: false,
    plannedDepartureDate: '',
    plannedDeliveryDate: '',
    plannedLoadingDurationMinutes: 60,
  });

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setLoadingTrucks(true);
        const response = await truckService.getAll();
        setAvailableTrucks(response?.data || []);
      } catch (err) {
        setAvailableTrucks([]);
      } finally {
        setLoadingTrucks(false);
      }
    };
    fetchTrucks();
  }, []);

  useEffect(() => {
    console.log('🔍 initialData in ShipmentForm:', initialData);
    if (initialData) {
      setFormData({
        description: initialData.description || '',
        origin: initialData.origin || '',
        destination: initialData.destination || '',
        originCoordinates: {
          lat: initialData.originCoordinates?.lat || '',
          lng: initialData.originCoordinates?.lng || '',
        },
        destinationCoordinates: {
          lat: initialData.destinationCoordinates?.lat || '',
          lng: initialData.destinationCoordinates?.lng || '',
        },
        weightKg: initialData.weightKg || '',
        shipmentType: initialData.shipmentType || 'normal',
        status: initialData.status || 'pending',
        truck: initialData.truck?._id || initialData.truck || '',
        customer: {
          name: initialData.customer?.name || '',
          phone: initialData.customer?.phone || '',
        },
        isPriority: initialData.isPriority || false,
        plannedLoadingDurationMinutes: initialData.plannedLoadingDurationMinutes ?? 60,
        plannedDepartureDate: initialData.plannedDepartureDate ? new Date(initialData.plannedDepartureDate).toISOString().slice(0, 16) : '',
        plannedDeliveryDate: initialData.plannedDeliveryDate ? new Date(initialData.plannedDeliveryDate).toISOString().slice(0, 16) : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      customer: { ...prev.customer, [name]: value },
    }));
  };
  const handleOriginCoordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      originCoordinates: {
        ...prev.originCoordinates,
        [name]: value === '' ? '' : parseFloat(value),
      },
    }));
  }
  const handleCoordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      destinationCoordinates: {
        ...prev.destinationCoordinates,
        [name]: value === '' ? '' : parseFloat(value),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description.trim()) return toast.error('Description required');
    if (!formData.origin.trim()) return toast.error('Origin required');
    if (!formData.destination.trim()) return toast.error('Destination required');
    if (!formData.weightKg || formData.weightKg <= 0) return toast.error('Valid weight required');
    if (!formData.customer.name.trim()) return toast.error('Customer name required');
    if (!formData.plannedDepartureDate) return toast.error('Planned departure date required');
    if (!formData.plannedDeliveryDate) return toast.error('Planned delivery date required');

    const cleanData = {
      description: formData.description.trim(),
      origin: formData.origin.trim(),
      destination: formData.destination.trim(),
      weightKg: parseFloat(formData.weightKg),
      shipmentType: formData.shipmentType,
      status: formData.status,
      isPriority: formData.isPriority,
      plannedLoadingDurationMinutes: formData.plannedLoadingDurationMinutes || 60,
      customer: {
        name: formData.customer.name.trim(),
        ...(formData.customer.phone && { phone: formData.customer.phone.trim() }),
      },
      ...(formData.truck && { truck: formData.truck }),
       ...(formData.originCoordinates.lat && formData.originCoordinates.lng && {
        originCoordinates: {
            lat: formData.originCoordinates.lat,
            lng: formData.originCoordinates.lng,
          },
        }),
      ...(formData.destinationCoordinates.lat && formData.destinationCoordinates.lng && {
        destinationCoordinates: {
          lat: formData.destinationCoordinates.lat,
          lng: formData.destinationCoordinates.lng,
        },
      }),
      plannedDepartureDate: new Date(formData.plannedDepartureDate).toISOString(),
      plannedDeliveryDate: new Date(formData.plannedDeliveryDate).toISOString(),
    };
    onSubmit(cleanData);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shipment Details */}
      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <input type="text" name="description" value={formData.description} onChange={handleChange} className={inputClass} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Origin *</label>
          <input type="text" name="origin" value={formData.origin} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Destination *</label>
          <input type="text" name="destination" value={formData.destination} onChange={handleChange} className={inputClass} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg) *</label>
          <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Shipment Type *</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'normal', label: 'Normal', icon: '📦', description: 'Standard goods', color: 'blue' },
              { value: 'refrigerated', label: 'Refrigerated', icon: '❄️', description: 'Temperature controlled', color: 'cyan' },
              { value: 'fragile', label: 'Fragile', icon: '🔔', description: 'Handle with care', color: 'amber' },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, shipmentType: type.value }))}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all ${
                  formData.shipmentType === type.value
                    ? type.color === 'blue'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : type.color === 'cyan'
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                      : 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-sm font-medium">{type.label}</span>
                <span className="text-xs opacity-70">{type.description}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="shipmentType" value={formData.shipmentType} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="isPriority" checked={formData.isPriority} onChange={handleChange} className="rounded" />
        <label className="text-sm">Priority Shipment</label>
      </div>
      {/* Planned Loading Duration */}
      <div>
        <label className="block text-sm font-medium mb-1">Planned Loading Duration (minutes)</label>
        <input
          type="number"
          name="plannedLoadingDurationMinutes"
          value={formData.plannedLoadingDurationMinutes}
          onChange={handleChange}
          min="0"
          step="1"
          className={inputClass}
          placeholder="e.g., 60"
        />
        <p className="text-xs text-gray-500 mt-1">
          Expected time to load the truck at the origin gate.
        </p>
      </div>
      {/* Planned Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Planned Departure Date *</label>
          <input
            type="datetime-local"
            name="plannedDepartureDate"
            value={formData.plannedDepartureDate}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Planned Delivery Date *</label>
          <input
            type="datetime-local"
            name="plannedDeliveryDate"
            value={formData.plannedDeliveryDate}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>
      </div>
      { /* Origin Coordinates */ }
      <div>
        <label className="block text-sm font-medium mb-1">Origin Coordinates (Optional)</label>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" name="lat" value={formData.originCoordinates.lat} onChange={handleOriginCoordChange} placeholder="Latitude" className={inputClass} step="any" />
          <input type="number" name="lng" value={formData.originCoordinates.lng} onChange={handleOriginCoordChange} placeholder="Longitude" className={inputClass} step="any" />
        </div>
      </div>

      {/* Destination Coordinates */}
      <div>
        <label className="block text-sm font-medium mb-1">Destination Coordinates (Optional)</label>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" name="lat" value={formData.destinationCoordinates.lat} onChange={handleCoordChange} placeholder="Latitude" className={inputClass} step="any" />
          <input type="number" name="lng" value={formData.destinationCoordinates.lng} onChange={handleCoordChange} placeholder="Longitude" className={inputClass} step="any" />
        </div>
      </div>

      {/* Customer */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Name *</label>
          <input type="text" name="name" value={formData.customer.name} onChange={handleCustomerChange} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Customer Phone</label>
          <input type="tel" name="phone" value={formData.customer.phone} onChange={handleCustomerChange} className={inputClass} />
        </div>
      </div>

      {/* Truck Assignment */}
      <div>
        <label className="block text-sm font-medium mb-1">Assign Truck (Optional)</label>
        <select name="truck" value={formData.truck} onChange={handleChange} className={inputClass} disabled={loadingTrucks}>
          <option value="">-- Not assigned --</option>
          {availableTrucks.map(truck => (
            <option key={truck._id} value={truck._id}>{truck.licensePlate} - {truck.brand} {truck.model}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Buttons – now includes Cancel and dynamic submit text */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Update Shipment' : 'Create Shipment'}
        </button>
      </div>
    </form>
  );
};

export default ShipmentForm;