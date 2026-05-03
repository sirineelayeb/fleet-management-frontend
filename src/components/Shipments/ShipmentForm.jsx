import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { loadingZoneService } from '../../services/loadingZoneService';
import MapPicker from '../common/MapPicker';
import Modal from '../common/Modal';
import { MapPinIcon, PlusIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ShipmentForm = ({ onSubmit, initialData, onCancel }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loadingZones, setLoadingZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOriginMap, setShowOriginMap] = useState(false);
  const [showDestMap, setShowDestMap] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    goods: '',
    origin: '',
    destination: '',
    originPlaceName: '',
    destinationPlaceName: '',
    originCoordinates: { lat: '', lng: '' },
    destinationCoordinates: { lat: '', lng: '' },
    weightKg: '',
    shipmentType: 'normal',
    status: 'pending',
    customer: '',
    loadingZone: '',
    isPriority: false,
    plannedDepartureDate: '',
    plannedDeliveryDate: '',
  });

  // Fetch customers and loading zones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersRes, zonesRes] = await Promise.all([
          customerService.getAll({ isActive: true, limit: 100 }),
          loadingZoneService.getAll({ status: 'active', limit: 100 })
        ]);
        setCustomers(customersRes?.data || []);
        setLoadingZones(zonesRes?.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Restore form data from sessionStorage
    const shouldReturn = sessionStorage.getItem('returnToShipmentForm');
    if (shouldReturn === 'true') {
      const savedData = sessionStorage.getItem('shipmentFormData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsedData }));
          toast.success('Form data restored');
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      }
      sessionStorage.removeItem('shipmentFormData');
      sessionStorage.removeItem('returnToShipmentForm');
    }
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description || '',
        goods: initialData.goods || '',
        origin: initialData.origin || '',
        destination: initialData.destination || '',
        originPlaceName: initialData.originPlaceName || '',
        destinationPlaceName: initialData.destinationPlaceName || '',
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
        customer: initialData.customer?._id || initialData.customer || '',
        loadingZone: initialData.loadingZone?._id || initialData.loadingZone || '',
        isPriority: initialData.isPriority || false,
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

  const handleOriginCoordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      originCoordinates: {
        ...prev.originCoordinates,
        [name]: value === '' ? '' : parseFloat(value),
      },
    }));
  };

  const handleDestCoordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      destinationCoordinates: {
        ...prev.destinationCoordinates,
        [name]: value === '' ? '' : parseFloat(value),
      },
    }));
  };

  const handleOriginMapSelect = (lat, lng, placeName) => {
    setFormData(prev => ({
      ...prev,
      originCoordinates: { lat, lng },
      originPlaceName: placeName,
      origin: placeName || `${lat}, ${lng}`
    }));
    setShowOriginMap(false);
  };

  const handleDestMapSelect = (lat, lng, placeName) => {
    setFormData(prev => ({
      ...prev,
      destinationCoordinates: { lat, lng },
      destinationPlaceName: placeName,
      destination: placeName || `${lat}, ${lng}`
    }));
    setShowDestMap(false);
  };

  const handleCustomerChange = (customerId) => {
    const selectedCustomer = customers.find(c => c._id === customerId);
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customer: customerId,
        destination: selectedCustomer.address || selectedCustomer.location?.placeName || '',
        destinationCoordinates: {
          lat: selectedCustomer.location?.lat || '',
          lng: selectedCustomer.location?.lng || ''
        },
        destinationPlaceName: selectedCustomer.location?.placeName || selectedCustomer.address || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, customer: '' }));
    }
  };

  // Auto-fill origin from loading zone
  const handleLoadingZoneChange = (loadingZoneId) => {
    const selectedZone = loadingZones.find(zone => zone._id === loadingZoneId);
    if (selectedZone) {
      const locationName = selectedZone.location?.placeName || selectedZone.name;
      // Validate that coordinates exist
      if (!selectedZone.location?.lat || !selectedZone.location?.lng) {
        toast.error('This loading zone has no valid coordinates. Please edit the zone first.');
        return;
      }
      setFormData(prev => ({
        ...prev,
        loadingZone: loadingZoneId,
        origin: locationName,
        originCoordinates: {
          lat: selectedZone.location.lat,
          lng: selectedZone.location.lng
        },
        originPlaceName: locationName
      }));
      toast.success(`Origin set to "${locationName}"`);
    } else {
      setFormData(prev => ({ ...prev, loadingZone: '' }));
    }
  };

  // Clear origin coordinates (keep text field)
  const clearOriginCoordinates = () => {
    setFormData(prev => ({
      ...prev,
      originCoordinates: { lat: '', lng: '' },
      originPlaceName: ''
    }));
    toast.success('Origin coordinates cleared');
  };

  // Clear destination coordinates
  const clearDestinationCoordinates = () => {
    setFormData(prev => ({
      ...prev,
      destinationCoordinates: { lat: '', lng: '' },
      destinationPlaceName: ''
    }));
    toast.success('Destination coordinates cleared');
  };

  // Reset loading zone selection (clear origin auto-fill)
  const resetLoadingZone = () => {
    setFormData(prev => ({
      ...prev,
      loadingZone: '',
      origin: '',
      originCoordinates: { lat: '', lng: '' },
      originPlaceName: ''
    }));
  };

  // Navigate to create customer page
  const handleCreateCustomer = () => {
    sessionStorage.setItem('shipmentFormData', JSON.stringify(formData));
    sessionStorage.setItem('returnToShipmentForm', 'true');
    navigate('/dashboard/customers');
  };

  // Navigate to create loading zone page
  const handleCreateLoadingZone = () => {
    sessionStorage.setItem('shipmentFormData', JSON.stringify(formData));
    sessionStorage.setItem('returnToShipmentForm', 'true');
    navigate('/dashboard/loading-zones');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = [];
    
    if (!formData.description.trim()) errors.push('Description required');
    if (!formData.goods.trim()) errors.push('Goods description required');
    if (!formData.origin.trim()) errors.push('Origin required');
    if (!formData.destination.trim()) errors.push('Destination required');
    if (!formData.weightKg || formData.weightKg <= 0) errors.push('Valid weight required');
    if (!formData.customer) errors.push('Customer required');
    if (!formData.plannedDepartureDate) errors.push('Planned departure date required');
    if (!formData.plannedDeliveryDate) errors.push('Planned delivery date required');
    
    // Validate dates
    if (formData.plannedDepartureDate && formData.plannedDeliveryDate) {
      const departure = new Date(formData.plannedDepartureDate);
      const delivery = new Date(formData.plannedDeliveryDate);
      if (departure >= delivery) {
        errors.push('Delivery date must be after departure date');
      }
    }
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    
    const cleanData = {
      description: formData.description.trim(),
      goods: formData.goods.trim(),
      origin: formData.origin.trim(),
      destination: formData.destination.trim(),
      weightKg: parseFloat(formData.weightKg),
      shipmentType: formData.shipmentType,
      isPriority: formData.isPriority,
      customer: formData.customer,
      ...(formData.loadingZone && { loadingZone: formData.loadingZone }),
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

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm";

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description *</label>
              <input type="text" name="description" value={formData.description} onChange={handleChange} className={inputClass} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Goods (Items being shipped) *</label>
              <textarea name="goods" value={formData.goods} onChange={handleChange} rows="2" className={inputClass} required placeholder="e.g., Electronics, Furniture, Food products..." />
            </div>
          </div>
        </div>

        {/* Route Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Origin *</label>
              <input type="text" name="origin" value={formData.origin} onChange={handleChange} className={inputClass} required placeholder="e.g., Tunis, Tunisia" />
              {formData.originPlaceName && (
                <p className="text-xs text-green-600 mt-1">✓ {formData.originPlaceName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination *</label>
              <input type="text" name="destination" value={formData.destination} onChange={handleChange} className={inputClass} required placeholder="e.g., Sfax, Tunisia" />
              {formData.destinationPlaceName && (
                <p className="text-xs text-green-600 mt-1">✓ {formData.destinationPlaceName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Customer *</label>
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" />
              Create New Customer
            </button>
          </div>
          <select
            name="customer"
            value={formData.customer}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select a customer...</option>
            {customers.map(customer => (
              <option key={customer._id} value={customer._id}>
                {customer.name} -
                {customer.location?.placeName && ` 📍 ${customer.location.placeName}`} - {customer.phone}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Customer's address will auto-fill as destination when selected
          </p>
        </div>

        {/* Loading Zone Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Loading Zone (Optional)</label>
            <button
              type="button"
              onClick={handleCreateLoadingZone}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" />
              Create Loading Zone
            </button>
          </div>
          <div className="flex gap-2">
            <select
              name="loadingZone"
              value={formData.loadingZone}
              onChange={(e) => handleLoadingZoneChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a loading zone...</option>
              {loadingZones.map(zone => (
                <option key={zone._id} value={zone._id}>
                  {zone.name || zone.name} - {zone.description || 'No description'} - {zone.location?.placeName ? `📍 ${zone.location.placeName}` : 'No location'}
                </option>
              ))}
            </select>
            {formData.loadingZone && (
              <button
                type="button"
                onClick={resetLoadingZone}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                title="Clear loading zone and origin"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select a loading zone - origin will auto-fill with its address and coordinates
          </p>
        </div>

        {/* Origin Coordinates Block */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <label className="block text-sm font-medium">Origin Coordinates (Optional)</label>
            <div className="flex gap-2">
              {formData.originCoordinates.lat && formData.originCoordinates.lng && (
                <button 
                  type="button" 
                  onClick={clearOriginCoordinates}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 flex items-center gap-1"
                >
                  <XMarkIcon className="h-3 w-3" />
                  Clear
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setShowOriginMap(true)} 
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <MapPinIcon className="h-4 w-4" /> 
                Choose on Map
              </button>
            </div>
          </div>
          
          {formData.originPlaceName && (
            <div className="mb-3 p-2 bg-green-100 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs text-green-800 font-medium">Selected Place:</p>
                <p className="text-sm text-green-900">📍 {formData.originPlaceName}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input 
                type="number" 
                name="lat" 
                value={formData.originCoordinates.lat} 
                onChange={handleOriginCoordChange} 
                placeholder="e.g., 36.8065" 
                className={inputClass} 
                step="any" 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input 
                type="number" 
                name="lng" 
                value={formData.originCoordinates.lng} 
                onChange={handleOriginCoordChange} 
                placeholder="e.g., 10.1815" 
                className={inputClass} 
                step="any" 
              />
            </div>
          </div>
        </div>

        {/* Destination Coordinates Block */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <label className="block text-sm font-medium">Destination Coordinates (Optional)</label>
            <div className="flex gap-2">
              {formData.destinationCoordinates.lat && formData.destinationCoordinates.lng && (
                <button 
                  type="button" 
                  onClick={clearDestinationCoordinates}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 flex items-center gap-1"
                >
                  <XMarkIcon className="h-3 w-3" />
                  Clear
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setShowDestMap(true)} 
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <MapPinIcon className="h-4 w-4" /> 
                Choose on Map
              </button>
            </div>
          </div>
          
          {formData.destinationPlaceName && (
            <div className="mb-3 p-2 bg-green-100 rounded-lg">
              <p className="text-xs text-green-800 font-medium">Selected Place:</p>
              <p className="text-sm text-green-900">📍 {formData.destinationPlaceName}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input 
                type="number" 
                name="lat" 
                value={formData.destinationCoordinates.lat} 
                onChange={handleDestCoordChange} 
                placeholder="e.g., 34.7406" 
                className={inputClass} 
                step="any" 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input 
                type="number" 
                name="lng" 
                value={formData.destinationCoordinates.lng} 
                onChange={handleDestCoordChange} 
                placeholder="e.g., 10.7603" 
                className={inputClass} 
                step="any" 
              />
            </div>
          </div>
        </div>

        {/* Cargo Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cargo Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Weight (kg) *</label>
              <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} className={inputClass} required min="0" step="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Shipment Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'normal', label: 'Normal', icon: '📦', color: 'blue' },
                  { value: 'refrigerated', label: 'Refrigerated', icon: '❄️', color: 'cyan' },
                  { value: 'fragile', label: 'Fragile', icon: '🔔', color: 'amber' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, shipmentType: type.value }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-center transition-all ${
                      formData.shipmentType === type.value
                        ? type.color === 'blue'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : type.color === 'cyan'
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                          : 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isPriority" checked={formData.isPriority} onChange={handleChange} className="rounded" />
          <label className="text-sm font-medium">Priority Shipment</label>
        </div>

        {/* Schedule Dates */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Planned Departure Date *</label>
              <input type="datetime-local" name="plannedDepartureDate" value={formData.plannedDepartureDate} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Planned Delivery Date *</label>
              <input type="datetime-local" name="plannedDeliveryDate" value={formData.plannedDeliveryDate} onChange={handleChange} className={inputClass} required />
            </div>
          </div>
        </div>

        {/* Note about assignment */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            After creating the shipment, you can assign a truck and driver using the "Assign" button on the shipment card.
            The shipment will remain in "Pending" status until assigned.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              Cancel
            </button>
          )}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {initialData ? 'Update Shipment' : 'Create Shipment'}
          </button>
        </div>
      </form>

      {/* Origin Map Modal */}
      <Modal
        isOpen={showOriginMap}
        onClose={() => setShowOriginMap(false)}
        title="Select Origin Location"
        size="lg"
      >
        <MapPicker
          onSelect={handleOriginMapSelect}
          onClose={() => setShowOriginMap(false)}
          title="Select Origin Location"
        />
      </Modal>

      {/* Destination Map Modal */}
      <Modal
        isOpen={showDestMap}
        onClose={() => setShowDestMap(false)}
        title="Select Destination Location"
        size="lg"
      >
        <MapPicker
          onSelect={handleDestMapSelect}
          onClose={() => setShowDestMap(false)}
          title="Select Destination Location"
        />
      </Modal>
    </>
  );
};

export default ShipmentForm;