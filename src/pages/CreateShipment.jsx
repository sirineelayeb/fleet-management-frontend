// frontend/src/pages/CreateShipment.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentService } from '../services/shipmentService';
import ShipmentForm from '../components/Shipments/ShipmentForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CreateShipment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => shipmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipments']);
      toast.success('Shipment created');
      navigate('/shipment_manager/shipments');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Create failed'),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back button instead of Cancel */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/shipment_manager/shipments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5" /> Back to Shipments
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Create New Shipment</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <ShipmentForm
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          // ❌ No onCancel prop – the back button handles navigation
        />
      </div>
    </div>
  );
};

export default CreateShipment;