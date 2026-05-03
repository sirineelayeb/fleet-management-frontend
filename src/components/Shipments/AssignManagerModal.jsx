import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserGroupIcon, TrashIcon } from '@heroicons/react/24/outline';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';

const AssignManagerModal = ({ shipment, onClose, onAssign, onUnassign }) => {
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [unassigning, setUnassigning] = useState(false);

  // Check if already assigned
  const isAlreadyAssigned = shipment?.assignedTo !== null && shipment?.assignedTo !== undefined;
  const currentManagerId = isAlreadyAssigned 
    ? (typeof shipment.assignedTo === 'object' ? shipment.assignedTo._id : shipment.assignedTo)
    : null;
  const currentManagerName = isAlreadyAssigned && typeof shipment.assignedTo === 'object' 
    ? shipment.assignedTo.name 
    : null;

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoadingManagers(true);
        const response = await userService.getShipmentManagers();
        let allManagers = response.data || [];
        
        // If already assigned, filter out the current manager from the list
        if (isAlreadyAssigned && currentManagerId) {
          allManagers = allManagers.filter(manager => manager._id !== currentManagerId);
        }
        
        setManagers(allManagers);
      } catch (error) {
        console.error('Error fetching managers:', error);
        toast.error('Failed to load managers');
      } finally {
        setLoadingManagers(false);
      }
    };
    fetchManagers();
  }, [isAlreadyAssigned, currentManagerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedManagerId) {
      toast.error('Please select a manager');
      return;
    }
    
    setLoading(true);
    try {
      await onAssign(shipment._id, selectedManagerId);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign manager');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm('Are you sure you want to unassign the manager from this shipment?')) {
      return;
    }
    
    setUnassigning(true);
    try {
      await onUnassign(shipment._id);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unassign manager');
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5" />
            {isAlreadyAssigned ? 'Reassign Shipment Manager' : 'Assign Shipment Manager'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm font-medium">{shipment.description}</p>
          <p className="text-sm text-gray-600">{shipment.origin} → {shipment.destination}</p>
          
          {/* Show current assignment if exists */}
          {isAlreadyAssigned && currentManagerName && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-blue-800 mb-1">Currently Assigned to:</p>
                  <p className="text-sm text-blue-700">
                    👤 {currentManagerName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUnassign}
                  disabled={unassigning}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <TrashIcon className="h-3 w-3" />
                  {unassigning ? 'Removing...' : 'Remove'}
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Reassigning will change the manager responsible for this shipment
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAlreadyAssigned ? 'Select New Shipment Manager *' : 'Select Shipment Manager *'}
            </label>
            {loadingManagers ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {isAlreadyAssigned ? 'Select a different manager...' : 'Select a manager...'}
                </option>
                {managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} - {manager.email} 
                    {/* - {manager._id} */}
                  </option>
                ))}
              </select>
            )}
            {managers.length === 0 && !loadingManagers && (
              <p className="text-xs text-amber-600 mt-1">
                {isAlreadyAssigned 
                  ? 'No other shipment managers available. Create a new user with shipment_manager role first.'
                  : 'No shipment managers found. Create a user with shipment_manager role first.'}
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
              disabled={loading || managers.length === 0} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : (isAlreadyAssigned ? 'Reassign' : 'Assign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignManagerModal;