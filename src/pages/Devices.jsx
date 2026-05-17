import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '../services/deviceService';
import { truckService } from '../services/truckService';
import toast from 'react-hot-toast';
import DeviceForm from '../components/Forms/DeviceForm';
import Modal from '../components/Common/Modal';
import PaginationComponent from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';
import StatCard from '../components/Cards/StatCard';
import {
  PlusIcon,
  PencilIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';

// Status select component — brand device status colors
const StatusSelect = ({ status, onStatusChange, deviceId, isUpdating }) => {
  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== status) {
      onStatusChange(deviceId, newStatus);
    }
  };

  // active → teal, inactive → gray, maintenance → orange
  const getStatusStyle = (value) => {
    switch (value) {
      case 'active':      return 'bg-teal-100 text-teal-700';
      case 'inactive':    return 'bg-gray-100 text-gray-600';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      default:            return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={status}
        onChange={handleChange}
        disabled={isUpdating}
        className={`text-xs font-medium rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400 ${getStatusStyle(status)}`}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
      </select>
      {isUpdating && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-teal-500"></div>
      )}
    </div>
  );
};

// Assign Truck Modal
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
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <option value="">— Select a truck —</option>
        {trucks.map((truck) => (
          <option key={truck._id} value={truck._id}>
            {truck.licensePlate}{truck.model ? ` · ${truck.model}` : ''}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
        <button onClick={handleSubmit} disabled={!selectedTruckId} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50 hover:bg-teal-700">Assign</button>
      </div>
    </div>
  );
};

// Main Component
const Devices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [assigningDevice, setAssigningDevice] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 10);
  const [filters, setFilters] = useState({ status: '', search: '', archived: false });
  const [searchInput, setSearchInput] = useState('');

  const queryClient = useQueryClient();

  const {
    data: devicesData,
    isLoading,
    isFetching,
    error
  } = useQuery({
    queryKey: ['devices', page, limit, filters.status, filters.search, filters.archived],
    queryFn: () => {
      const params = {
        page,
        limit,
        status: filters.status || undefined,
        search: filters.search || undefined
      };
      if (filters.archived !== undefined) {
        params.archived = filters.archived;
      }
      return deviceService.getAll(params);
    },
    keepPreviousData: true,
    staleTime: 5000,
  });

  const { data: allTrucksData } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000, archived: false }),
  });

  const devices = devicesData?.data || [];
  const pagination = devicesData?.pagination || { total: 0, page: 1, pages: 1 };
  const allTrucks = allTrucksData?.data || [];

  // Stats
  const totalDevices    = pagination.total || 0;
  const activeDevices   = devices.filter(d => d.status === 'active').length;
  const avgBattery      = devices.length > 0
    ? Math.round(devices.reduce((sum, d) => sum + (d.batteryLevel || 0), 0) / devices.length)
    : 0;
  const lowBatteryDevices = devices.filter(d => (d.batteryLevel || 0) < 30).length;


  // Search handlers
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
    setPage(1);
  };
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };
  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, status }));
    setPage(1);
  };
  const handleArchiveFilter = (value) => {
    let archivedValue;
    if (value === 'all') archivedValue = undefined;
    else if (value === 'archived') archivedValue = true;
    else archivedValue = false;
    setFilters(prev => ({ ...prev, archived: archivedValue }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({ status: '', search: '', archived: false });
    setSearchInput('');
    setPage(1);
  };

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (data) => deviceService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device registered successfully');
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to register device')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => deviceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
      setIsModalOpen(false);
      setEditingDevice(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update device')
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => deviceService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device archived');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to archive device')
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id) => deviceService.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device restored');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to restore device')
  });

  const assignMutation = useMutation({
    mutationFn: ({ deviceId, truckId }) => deviceService.assignToTruck(deviceId, truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['trucks-all'] });
      toast.success('Truck assigned');
      setAssigningDevice(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to assign truck')
  });

  const unassignMutation = useMutation({
    mutationFn: (deviceId) => deviceService.unassignFromTruck(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['trucks-all'] });
      toast.success('Device unassigned');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to unassign device')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => deviceService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setUpdatingStatusId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
      setUpdatingStatusId(null);
    }
  });

  // Handlers
  const handleAssignTruck = (deviceId, truckId) => assignMutation.mutate({ deviceId, truckId });
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
    if (editingDevice) updateMutation.mutate({ id: editingDevice._id, data });
    else registerMutation.mutate(data);
  };
  const handleArchive = (id) => {
    if (window.confirm('Archive this device?')) archiveMutation.mutate(id);
  };
  const handleUnarchive = (id) => {
    if (window.confirm('Restore this device?')) unarchiveMutation.mutate(id);
  };

  // Battery color: teal → good, yellow → medium, orange → low
  const getBatteryColor = (level) => {
    if (level >= 70) return 'text-teal-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-orange-500';
  };

  if (isLoading && !devicesData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200 animate-pulse">
          <DevicePhoneMobileIcon className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading Devices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <p className="text-orange-600">Error loading devices: {error.message}</p>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage IoT devices and telemetry units</p>
        </div>
        <button
          onClick={() => { setEditingDevice(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Register Device</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Devices" value={totalDevices}      icon={DevicePhoneMobileIcon}   color="blue"   subtitle="Registered devices" />
        <StatCard title="Active"        value={activeDevices}     icon={CheckCircleIcon}         color="teal"   subtitle="Online & working" />
        <StatCard title="Avg Battery"   value={`${avgBattery}%`}  icon={BoltIcon}                color="gold"   subtitle="Average charge" />
        <StatCard title="Low Battery"   value={lowBatteryDevices} icon={ExclamationTriangleIcon} color="orange" subtitle="Below 30%" />
      </div>
      {/* Search & Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by Device ID..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            value={filters.archived === undefined ? 'all' : filters.archived === true ? 'archived' : 'current'}
            onChange={(e) => handleArchiveFilter(e.target.value)}
          >
            <option value="all">All Devices</option>
            <option value="current">Current Devices</option>
            <option value="archived">Archived Devices</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          {(filters.status || filters.search || filters.archived !== false) && (
            <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Clear</button>
          )}
        </div>
      </div>

      {/* Devices Table */}
      {isFetching ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center" style={{ minHeight: 320 }}>
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
            <p className="text-sm text-gray-400 font-medium">Loading devices...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Battery</th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firmware</th> */}
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
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-teal-500" />
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
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        v{device.firmwareVersion || '1.0.0'}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {device.truck ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <TruckIcon className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{device.truck.licensePlate}</p>
                                {device.truck.model && <p className="text-xs text-gray-500">{device.truck.model}</p>}
                              </div>
                            </div>
                            <button onClick={() => handleUnassignTruck(device)} className="text-orange-500 hover:text-orange-700" title="Unassign truck">
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setAssigningDevice(device)} className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1">
                            <TruckIcon className="h-4 w-4" /> Assign Truck
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
                          className="text-teal-600 hover:text-teal-900 mr-3"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {filters.archived === true ? (
                          <button onClick={() => handleUnarchive(device._id)} className="text-teal-600 hover:text-teal-800" title="Restore">
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button onClick={() => handleArchive(device._id)} className="text-orange-500 hover:text-orange-700" title="Archive">
                            <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                          </button>
                        )}
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
        </>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingDevice(null); }}
        title={editingDevice ? 'Edit Device' : 'Register New Device'}
        size="lg"
      >
        <DeviceForm onSubmit={handleSubmit} initialData={editingDevice} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <Modal isOpen={!!assigningDevice} onClose={() => setAssigningDevice(null)} title="Assign Device to Truck" size="sm">
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