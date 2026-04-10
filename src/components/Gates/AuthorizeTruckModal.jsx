// frontend/src/components/Gates/AuthorizeTruckModal.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gateService } from '../../services/gateService';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

const AuthorizeTruckModal = ({ gate, trucks, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [selectedTruckId, setSelectedTruckId] = useState('');

  // Fetch current authorized trucks for this gate
  const { data: authTrucksData, isLoading: authLoading } = useQuery({
    queryKey: ['authorized-trucks', gate._id],
    queryFn: () => gateService.getAuthorizedTrucks(gate._id),
  });
  const authorizedTrucks = authTrucksData?.data || [];

  const authorizedTruckIds = authorizedTrucks.map(t => t._id);
  const availableTrucks = trucks.filter(truck => !authorizedTruckIds.includes(truck._id));

  // Mutations (unchanged)
  const addMutation = useMutation({
    mutationFn: (truckId) => gateService.authorizeTruck(gate._id, truckId),
    onSuccess: () => {
      queryClient.invalidateQueries(['authorized-trucks', gate._id]);
      queryClient.invalidateQueries(['gates']);
      setSelectedTruckId('');
      if (onSuccess) onSuccess();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (truckId) => gateService.removeAuthorizedTruck(gate._id, truckId),
    onSuccess: () => {
      queryClient.invalidateQueries(['authorized-trucks', gate._id]);
      queryClient.invalidateQueries(['gates']);
      if (onSuccess) onSuccess();
    },
  });

  const handleAdd = () => {
    if (!selectedTruckId) return;
    addMutation.mutate(selectedTruckId);
  };

  const handleRemove = (truckId) => {
    if (window.confirm('Remove this truck from authorized list?')) {
      removeMutation.mutate(truckId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Authorize Trucks - {gate.name}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            >
              <option value="">Select a truck...</option>
              {/* ✅ Use availableTrucks (not authorized yet) */}
              {availableTrucks.map(truck => (
                <option key={truck._id} value={truck._id}>
                  {truck.licensePlate} - {truck.brand} {truck.model}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedTruckId || addMutation.isPending || availableTrucks.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Authorized Trucks ({authorizedTrucks.length})
            </h3>
            {authLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : authorizedTrucks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No trucks authorized</div>
            ) : (
              <ul className="space-y-2">
                {authorizedTrucks.map(truck => (
                  <li key={truck._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{truck.licensePlate}</span>
                      <span className="text-sm text-gray-500 ml-2">{truck.brand} {truck.model}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(truck._id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={removeMutation.isPending}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorizeTruckModal;