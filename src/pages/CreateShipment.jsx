import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentService } from '../services/shipmentService';
import ShipmentForm from '../components/Shipments/ShipmentForm';
import {
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Cargo Details', icon: ClipboardDocumentListIcon, description: 'What are you shipping?' },
  { id: 2, label: 'Route', icon: MapPinIcon, description: 'Origin & destination' },
  { id: 3, label: 'Schedule', icon: TruckIcon, description: 'Dates & assignment' },
];

const CreateShipment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep] = useState(1); // Visual only — form handles actual progress

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(backPath)}
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-all duration-200"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <ArrowLeftIcon className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium">Back to Shipments</span>
          </button>

          {/* Step indicators */}
          <div className="hidden sm:flex items-center gap-1">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.id === activeStep;
              const isDone = step.id < activeStep;
              return (
                <React.Fragment key={step.id}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{step.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="w-6 h-px bg-gray-200 mx-0.5" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            {/* Icon badge */}
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <TruckIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Shipment</h1>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
                Fill in the details below to create a new shipment. You can assign a truck and driver after creation.
              </p>
            </div>
          </div>
        </div>

        {/* Info cards row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: '📦', title: 'Define cargo', desc: 'Goods, type & weight' },
            { icon: '🗺️', title: 'Set the route', desc: 'Pick origin & destination' },
            { icon: '📅', title: 'Add schedule', desc: 'Departure & delivery dates' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card top accent */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-8">
            <ShipmentForm
              onSubmit={async (data) => {
                await createMutation.mutateAsync(data);
              }}
              // No onCancel — back button handles navigation
            />
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Shipment will be saved as <strong className="text-gray-500">Pending</strong> until a truck is assigned</span>
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;