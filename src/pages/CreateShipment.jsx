import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentService } from '../services/shipmentService';
import ShipmentForm from '../components/Shipments/ShipmentForm';
import { ArrowLeftIcon, TruckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CreateShipment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const backPath = window.location.pathname.includes('shipment_manager')
    ? '/shipment_manager/shipments'
    : '/dashboard/shipments';

  const createMutation = useMutation({
    mutationFn: (data) => shipmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipments']);
      toast.success('Shipment created successfully!');
      navigate(backPath);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create shipment'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-indigo-50/20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button – part of the normal document flow, scrolls away */}
        <div className="mb-6">
          <button
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Shipments</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
              <TruckIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Shipment</h1>
              <p className="text-gray-500 text-sm">Fill in the details below to create a new shipment...</p>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { title: 'Define cargo', desc: 'Goods, type & weight' },
            { title: 'Set the route', desc: 'Pick origin & destination' },
            { title: 'Add schedule', desc: 'Departure & delivery dates' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
              <div>
                <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-600" />          
          <div className="p-8">
            <ShipmentForm
              onSubmit={async (data) => {
                await createMutation.mutateAsync(data);
              }}
            />
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span>Shipment will be saved as <strong className="text-gray-500">Pending</strong> until a truck is assigned</span>
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;