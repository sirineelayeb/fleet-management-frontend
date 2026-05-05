// frontend/src/pages/Devices.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '../services/deviceService';
import { truckService } from '../services/truckService';
import toast from 'react-hot-toast';
import DeviceForm from '../components/Forms/DeviceForm';
import Modal from '../components/Common/Modal';
import PaginationComponent from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatCard from '../components/Cards/StatCard';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  SignalIcon,
  CpuChipIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Simple inline select for status
const StatusSelect = ({ status, onStatusChange, deviceId, isUpdating }) => {
  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== status) {
      onStatusChange(deviceId, newStatus);
    }
  };

  const getStatusStyle = (value) => {
    switch (value) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={status}
        onChange={handleChange}
        disabled={isUpdating}
        className={`text-xs font-medium rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 ${getStatusStyle(status)}`}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
      </select>
      {isUpdating && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
      )}
    </div>
  );
};

// Assign Truck Modal content
const AssignTruckModal = ({ device, trucks, onAssign, onClose }) => {
  const [selectedTruckId, setSelectedTruckId] = useState('');

  const handleSubmit = () => {
    if (!selectedTruckId) return;
    onAssign(device._id, selectedTruckId);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select a truck to assign{' '}
        <span className="font-semibold text-gray-900">{device.deviceId}</span> to:
      </p>
      <select
        value={selectedTruckId}
        onChange={(e) => setSelectedTruckId(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">— Select a truck —</option>
        {trucks.map((truck) => (
          <option key={truck._id} value={truck._id}>
            {truck.licensePlate}{truck.model ? ` · ${truck.model}` : ''}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedTruckId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Assign
        </button>
      </div>
    </div>
  );
};

// Main Page
const Devices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [assigningDevice, setAssigningDevice] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 10);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  
  const queryClient = useQueryClient();

  // Queries with pagination
  const { 
    data: devicesData, 
    isLoading, 
    isFetching,
    error 
  } = useQuery({
    queryKey: ['devices', page, limit, filters],
    queryFn: () => deviceService.getAll({ 
      page, 
      limit: limit,
      status: filters.status || undefined,
      search: filters.search || undefined
    }),
    keepPreviousData: true,
    staleTime: 5000,
  });

  // Fetch all trucks for assignment
  const { data: allTrucksData } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000 }),
  });

  // Safe extraction
  const devices = devicesData?.data || [];
  const pagination = devicesData?.pagination || { total: 0, page: 1, pages: 1 };
  const allTrucks = allTrucksData?.data || [];

  // Search handlers
  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusChange = (status) => {
    setFilters({ ...filters, status });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', search: '' });
    setSearchInput('');
    setPage(1);
  };

  // Statistics calculations - Only important ones
  const totalDevices = pagination.total || 0;
  const activeDevices = devices.filter(d => d.status === 'active').length;
  const assignedDevices = devices.filter(d => d.truck).length;
  const avgBattery = devices.length > 0
    ? Math.round(devices.reduce((sum, d) => sum + (d.batteryLevel || 0), 0) / devices.length)
    : 0;
  const lowBatteryDevices = devices.filter(d => (d.batteryLevel || 0) < 30).length;

  const registerMutation = useMutation({
    mutationFn: (data) => deviceService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device registered successfully');
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to register device');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => deviceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
      setIsModalOpen(false);
      setEditingDevice(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update device');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deviceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete device');
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ deviceId, truckId }) => deviceService.assignToTruck(deviceId, truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['trucks-all'] });
      toast.success('Truck assigned successfully');
      setAssigningDevice(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign truck');
    }
  });

  const unassignMutation = useMutation({
    mutationFn: (deviceId) => deviceService.unassignFromTruck(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['trucks-all'] });
      toast.success('Device unassigned successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unassign device');
    }
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => deviceService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Status updated');
      setUpdatingStatusId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
      setUpdatingStatusId(null);
    }
  });

  // Handlers
  const handleAssignTruck = (deviceId, truckId) => {
    assignMutation.mutate({ deviceId, truckId });
  };

  const handleUnassignTruck = (device) => {
    if (window.confirm(`Unassign truck from device "${device.deviceId}"?`)) {
      unassignMutation.mutate(device._id);
    }
  };

  const handleStatusUpdate = (deviceId, newStatus) => {
    setUpdatingStatusId(deviceId);
    updateStatusMutation.mutate({ id: deviceId, status: newStatus });
  };

  const handleSubmit = (data) => {
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice._id, data });
    } else {
      registerMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      deleteMutation.mutate(id);
    }
  };

  // Helpers
  const getBatteryColor = (level) => {
    if (level >= 70) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Loading / error states
  if (isLoading && !devicesData) {
   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
              <DevicePhoneMobileIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-500 text-sm font-medium animate-pulse">
              Loading Devices...
            </p>
          </div>
          );
        } 

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Error loading devices: {error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600 mt-1">Manage IoT devices and telemetry units</p>
        </div>
        <button
          onClick={() => { setEditingDevice(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Register Device
        </button>
      </div>

      {/* Statistics Cards - Only important ones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Devices"
          value={totalDevices}
          icon={DevicePhoneMobileIcon}
          color="purple"
          subtitle="Registered devices"
        />
        <StatCard
          title="Active"
          value={activeDevices}
          icon={CheckCircleIcon}
          color="green"
          subtitle="Online & working"
        />
        <StatCard
          title="Assigned to Trucks"
          value={assignedDevices}
          icon={TruckIcon}
          color="blue"
          subtitle="Connected to vehicles"
        />
        <StatCard
          title="Avg Battery"
          value={`${avgBattery}%`}
          icon={BoltIcon}
          color="yellow"
          subtitle="Average charge"
        />
        <StatCard
          title="Low Battery"
          value={lowBatteryDevices}
          icon={ExclamationTriangleIcon}
          color="red"
          subtitle="Below 30%"
        />
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by Device ID..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
          
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          
          {(filters.status || filters.search) && (
            <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Clear
            </button>
          )}
        </div>
        
        {isFetching && (
          <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading...
          </div>
        )}
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Battery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firmware</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Truck</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device) => (
                <tr key={device._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{device.deviceId}</div>
                      </div>
                    </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <BoltIcon className={`h-5 w-5 ${getBatteryColor(device.batteryLevel || 0)}`} />
                      <span className="text-sm text-gray-900">{device.batteryLevel || 0}%</span>
                    </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    v{device.firmwareVersion || '1.0.0'}
                    </td>

                  {/* Assigned Truck Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {device.truck ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {device.truck.licensePlate}
                            </p>
                            {device.truck.model && (
                              <p className="text-xs text-gray-500">{device.truck.model}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassignTruck(device)}
                          className="text-red-600 hover:text-red-800"
                          title="Unassign truck"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningDevice(device)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <TruckIcon className="h-4 w-4" />
                        Assign Truck
                      </button>
                    )}
                    </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusSelect 
                      status={device.status}
                      deviceId={device._id}
                      onStatusChange={handleStatusUpdate}
                      isUpdating={updatingStatusId === device._id}
                    />
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => { setEditingDevice(device); setIsModalOpen(true); }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit Device"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(device._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Device"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                    </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No devices found. Click "Register Device" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <PaginationComponent
          currentPage={pagination.page || 1}
          totalPages={pagination.pages || 1}
          onPageChange={setPage}
          onPageSizeChange={handleLimitChange}
          pageSize={limit}
          totalItems={pagination.total || 0}
          showFirstLast={true}
          siblingCount={1}
          showPageSizeSelector={true}
          pageSizeOptions={[5, 10, 25, 50, 100]}
        />
      </div>

      {/* Register / Edit Device Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingDevice(null); }}
        title={editingDevice ? 'Edit Device' : 'Register New Device'}
        size="lg"
      >
        <DeviceForm
          onSubmit={handleSubmit}
          initialData={editingDevice}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Assign Truck Modal */}
      <Modal
        isOpen={!!assigningDevice}
        onClose={() => setAssigningDevice(null)}
        title="Assign Device to Truck"
        size="sm"
      >
        {assigningDevice && (
          <AssignTruckModal
            device={assigningDevice}
            trucks={allTrucks}
            onAssign={handleAssignTruck}
            onClose={() => setAssigningDevice(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Devices;