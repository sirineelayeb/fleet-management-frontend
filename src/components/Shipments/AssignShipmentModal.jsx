// frontend/src/components/Shipments/AssignShipmentModal.jsx
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AssignShipmentModal = ({ shipment, trucks, drivers, onClose, onAssign }) => {
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loading, setLoading] = useState(false);

  const trucksArray = Array.isArray(trucks) ? trucks : [];
  const driversArray = Array.isArray(drivers) ? drivers : [];

  // Filter available trucks (status = 'available')
  const availableTrucks = trucksArray.filter(truck => truck.status === 'available');
  
  // Filter available drivers (status = 'available' and not assigned to a truck)
  const availableDrivers = driversArray.filter(driver => 
    driver.status === 'available' && !driver.assignedTruck
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTruckId) {
      toast.error('Please select a truck');
      return;
    }
    
    // Driver is optional – if not selected, send null (backend will use truck's driver if available)
    const driverId = selectedDriverId || null;
    
    setLoading(true);
    try {
      await onAssign(shipment._id, selectedTruckId, driverId);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign shipment');
    } finally {
      setLoading(false);
    }
  };

  if (!shipment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Assign Shipment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600">Shipment: {shipment.description}</p>
          <p className="text-sm text-gray-600">Route: {shipment.origin} → {shipment.destination}</p>
          <p className="text-sm text-gray-600">Weight: {shipment.weightKg} kg</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Truck *
            </label>
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a truck...</option>
              {availableTrucks.map(truck => (
                <option key={truck._id} value={truck._id}>
                  {truck.licensePlate} - {truck.brand} {truck.model} ({truck.capacity} kg)
                </option>
              ))}
            </select>
            {selectedTruckId && (
              <p className="text-xs text-gray-500 mt-1">
                Truck's driver: {availableTrucks.find(t => t._id === selectedTruckId)?.driver?.name || 'None assigned'}
              </p>
            )}
            {availableTrucks.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No available trucks. All trucks are either in mission or maintenance.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Driver (Optional)
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use truck's driver (if assigned)</option>
              {availableDrivers.map(driver => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} - License: {driver.licenseNumber} (Score: {driver.score || 100})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If you select a driver, it will override the truck's assigned driver for this shipment.
            </p>
            {availableDrivers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No available drivers. All drivers are either busy or already assigned.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableTrucks.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignShipmentModal;