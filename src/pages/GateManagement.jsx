import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gateService } from '../services/gateService';
import { truckService } from '../services/truckService';
import {
  PlusIcon, PencilIcon, TrashIcon, EyeIcon, KeyIcon,
  FunnelIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import GateFormModal from '../components/Gates/GateFormModal';
import GateDetailsModal from '../components/Gates/GateDetailsModal';
import AuthorizeTruckModal from '../components/Gates/AuthorizeTruckModal';
console.log('GateManagement component rendered');

const GateManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ type: '', zone: '', isActive: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingGate, setEditingGate] = useState(null);
  const [selectedGate, setSelectedGate] = useState(null);
  const [showAuthorize, setShowAuthorize] = useState(null);

  // Fetch gates
  const { data: gatesData, isLoading, error, refetch } = useQuery({
    queryKey: ['gates', filters],
    queryFn: () => gateService.getAll(filters),
  });
  const gates = gatesData?.data || [];
console.log('gatesData:', gatesData);
console.log('gates array:', gates);
  // Fetch trucks for authorization dropdown
  const { data: trucksData } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => truckService.getAll(),
  });
  const trucks = trucksData?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: gateService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['gates']);
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete gate "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const resetFilters = () => {
    setFilters({ type: '', zone: '', isActive: '' });
  };

  const getTypeBadge = (type) => {
    const colors = {
      entry: 'bg-green-100 text-green-800',
      exit: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error loading gates: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Management</h1>
          <p className="text-gray-600 mt-1">Manage entry/exit points, loading zones, and access control</p>
        </div>
        <button
          onClick={() => { setEditingGate(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add Gate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <select
              value={filters.zone}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
              <option value="D">Zone D</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
            >
              <FunnelIcon className="h-4 w-4" />
              Reset Filters
            </button>
            <button
              onClick={() => refetch()}
              className="ml-2 flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Gates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loading Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gates.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">No gates found</td>
                </tr>
              ) : (
                gates.map((gate) => (
                  <tr key={gate._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{gate.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(gate.type)}`}>
                        {gate.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gate.zone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gate.location?.lat && gate.location?.lng ? `${gate.location.lat}, ${gate.location.lng}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {gate.currentQueue} / {gate.queueCapacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {gate.isLoadingZone ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Yes</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {gate.isActive ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setSelectedGate(gate)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => { setEditingGate(gate); setShowForm(true); }}
                        className="text-green-600 hover:text-green-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setShowAuthorize(gate)}
                        className="text-purple-600 hover:text-purple-800"
                        title="Authorize Trucks"
                      >
                        <KeyIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(gate._id, gate.name)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <GateFormModal
          gate={editingGate}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries(['gates']);
          }}
        />
      )}
      {showAuthorize && (
        <AuthorizeTruckModal
          gate={showAuthorize}
          trucks={trucks}
          onClose={() => setShowAuthorize(null)}
          onSuccess={() => {
            setShowAuthorize(null);
            queryClient.invalidateQueries(['gates']);
          }}
        />
      )}
      {selectedGate && (
        <GateDetailsModal
          gate={selectedGate}
          onClose={() => setSelectedGate(null)}
        />
      )}
    </div>
  );
};

export default GateManagement;