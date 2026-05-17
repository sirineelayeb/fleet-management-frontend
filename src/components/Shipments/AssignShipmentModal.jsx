import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AssignShipmentModal = ({ shipment, trucks, drivers, onClose, onAssign, onReassign }) => {
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, isShipmentManager } = useAuth();
  const modalRef = useRef(null);

  const isReassign = ['assigned', 'in_progress'].includes(shipment?.status);

  const trucksArray = Array.isArray(trucks) ? trucks : [];
  const driversArray = Array.isArray(drivers) ? drivers : [];

  // For reassign: show ALL non-maintenance trucks except the currently assigned one
  // For assign: show only available trucks
  const availableTrucks = isReassign
    ? trucksArray.filter(t =>
        t.status !== 'maintenance' &&
        t._id !== shipment?.truck?._id &&
        t._id !== shipment?.truck
      )
    : trucksArray.filter(t => t.status === 'available');

  const availableDrivers = isReassign
    ? driversArray.filter(d =>
        d._id !== shipment?.driver?._id &&
        d._id !== shipment?.driver
      )
    : driversArray.filter(d => d.status === 'available' && !d.assignedTruck);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Handle click outside
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleCreateTruck = () => {
    if (isAdmin) navigate('/dashboard/trucks');
    else if (isShipmentManager) navigate('/shipment_manager/trucks');
    else toast.error('Unauthorized access');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTruckId) {
      toast.error('Please select a truck');
      return;
    }

    // Warn if reassigning an in_progress shipment
    if (isReassign && shipment.status === 'in_progress') {
      const confirmed = window.confirm(
        'This shipment is currently in progress. Reassigning will cancel the active mission. Continue?'
      );
      if (!confirmed) return;
    }

    const driverId = selectedDriverId || null;
    setLoading(true);

    try {
      if (isReassign && typeof onReassign === 'function') {
        await onReassign(shipment._id, selectedTruckId, driverId);
      } else {
        await onAssign(shipment._id, selectedTruckId, driverId);
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || `Failed to ${isReassign ? 'reassign' : 'assign'} shipment`);
    } finally {
      setLoading(false);
    }
  };

  if (!shipment) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="bg-white rounded-lg w-full max-w-md">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {isReassign && <ArrowPathIcon className="h-5 w-5 text-teal-600" />}
            {isReassign ? 'Reassign Shipment' : 'Assign Shipment'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Shipment info */}
        <div className="p-4 border-b bg-gray-50 space-y-1">
          <p className="text-sm text-gray-600">Shipment: {shipment.description}</p>
          <p className="text-sm text-gray-600">Route: {shipment.origin} → {shipment.destination}</p>
          <p className="text-sm text-gray-600">Weight: {shipment.weightKg} kg</p>

          {/* Current assignment info when reassigning */}
          {isReassign && (shipment.truck || shipment.driver) && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1">Current Assignment:</p>
              {shipment.truck && (
                <p className="text-xs text-amber-700">
                  Truck: {shipment.truck?.licensePlate || shipment.truck}
                </p>
              )}
              {shipment.driver && (
                <p className="text-xs text-amber-700">
                  Driver: {shipment.driver?.name || shipment.driver}
                </p>
              )}
              {shipment.status === 'in_progress' && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Warning: Mission is currently in progress — reassigning will cancel it
                </p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">

          {/* Truck selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isReassign ? 'Select New Truck *' : 'Select Truck *'}
            </label>
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">
                {isReassign ? 'Select a different truck...' : 'Select a truck...'}
              </option>
              {availableTrucks.map(truck => (
                <option key={truck._id} value={truck._id}>
                  {truck.licensePlate} - {truck.brand} {truck.model} ({truck.capacity}T) · {truck.status}
                </option>
              ))}
            </select>

            {selectedTruckId && (
              <p className="text-xs text-gray-500 mt-1">
                Truck's driver: {availableTrucks.find(t => t._id === selectedTruckId)?.driver?.name || 'None assigned'}
              </p>
            )}

            {availableTrucks.length === 0 && (
              <div className="mt-2">
                <p className="text-xs text-amber-600">
                  No trucks available. All trucks are in maintenance.
                </p>
                <button
                  type="button"
                  onClick={handleCreateTruck}
                  className="mt-1 text-sm text-teal-600 hover:underline"
                >
                  + Create Truck
                </button>
              </div>
            )}
          </div>

          {/* Driver selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isReassign ? 'Select New Driver (Optional)' : 'Select Driver (Optional)'}
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Use truck's assigned driver</option>
              {availableDrivers.map(driver => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} - License: {driver.licenseNumber} (Score: {driver.score || 100})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If not selected, the truck's assigned driver will be used.
            </p>
            {availableDrivers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No other drivers available.
              </p>
            )}
          </div>

          {/* Buttons */}
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
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-colors ${
                isReassign
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {loading
                ? (isReassign ? 'Reassigning...' : 'Assigning...')
                : (isReassign ? 'Reassign' : 'Assign Shipment')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignShipmentModal;