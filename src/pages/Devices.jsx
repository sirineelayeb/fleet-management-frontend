import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceService } from '../services/deviceService';
import { truckService } from '../services/truckService';
import toast from 'react-hot-toast';
import DeviceForm from '../components/Forms/DeviceForm';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
  SignalIcon,
  CpuChipIcon,
  ClockIcon,
  WifiIcon,
  MapPinIcon,
  TruckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// ── Assign Truck Modal content ────────────────────────────────────────────────
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
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedTruckId}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Assign
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Devices = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [assigningDevice, setAssigningDevice] = useState(null);
  const queryClient = useQueryClient();

  // Fetch all devices
  const { data: devicesData, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAll(),
    retry: 1
  });

  // ✅ Fetch ALL trucks (not just unassigned) to allow multiple devices per truck
  const { data: allTrucksData } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000 }),
    retry: 1
  });

  const registerMutation = useMutation({
    mutationFn: (data) => deviceService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['devices']);
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
      queryClient.invalidateQueries(['devices']);
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
      queryClient.invalidateQueries(['devices']);
      toast.success('Device deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete device');
    }
  });

  const assignMutation = useMutation({
    mutationFn: ({ deviceId, truckId }) =>
      deviceService.assignToTruck(deviceId, truckId),
    onSuccess: () => {
      // Invalidate both devices and trucks (because truck.devices changed)
      queryClient.invalidateQueries(['devices']);
      queryClient.invalidateQueries(['trucks-all']);
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
      queryClient.invalidateQueries(['devices']);
      queryClient.invalidateQueries(['trucks-all']);
      toast.success('Device unassigned successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unassign device');
    }
  });

  const handleAssignTruck = (deviceId, truckId) => {
    assignMutation.mutate({ deviceId, truckId });
  };

  const handleUnassignTruck = (device) => {
    if (window.confirm(`Unassign truck from device "${device.deviceId}"?`)) {
      unassignMutation.mutate(device._id);
    }
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

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800'
    };
    return `px-2 py-1 text-xs rounded-full font-medium ${colors[status] || colors.inactive}`;
  };

  const getBatteryColor = (level) => {
    if (level >= 70) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'esp32': return <WifiIcon className="h-5 w-5 text-blue-500" />;
      case 'gps':   return <MapPinIcon className="h-5 w-5 text-green-500" />;
      case 'sim808': return <DevicePhoneMobileIcon className="h-5 w-5 text-purple-500" />;
      default:      return <CpuChipIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'esp32':  return 'ESP32';
      case 'gps':    return 'GPS Tracker';
      case 'sim808': return 'SIM808';
      default:       return type;
    }
  };

  if (isLoading) return <LoadingSpinner />;

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

  const devices = devicesData?.data || [];
  const allTrucks = allTrucksData?.data || [];

  const totalDevices       = devices.length;
  const activeDevices      = devices.filter(d => d.status === 'active').length;
  const inactiveDevices    = devices.filter(d => d.status === 'inactive').length;
  const maintenanceDevices = devices.filter(d => d.status === 'maintenance').length;
  const avgBattery = devices.length > 0
    ? Math.round(devices.reduce((sum, d) => sum + (d.batteryLevel || 0), 0) / devices.length)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600 mt-1">Manage IoT devices and GPS trackers</p>
        </div>
        <button
          onClick={() => { setEditingDevice(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Register Device
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {[
          { label: 'Total Devices', value: totalDevices,       icon: <DevicePhoneMobileIcon className="h-8 w-8 text-blue-500"   />, color: 'text-gray-900'   },
          { label: 'Active',        value: activeDevices,      icon: <SignalIcon             className="h-8 w-8 text-green-500"  />, color: 'text-green-600'  },
          { label: 'Inactive',      value: inactiveDevices,    icon: <CpuChipIcon            className="h-8 w-8 text-gray-500"   />, color: 'text-gray-600'   },
          { label: 'Maintenance',   value: maintenanceDevices, icon: <WifiIcon               className="h-8 w-8 text-yellow-500" />, color: 'text-yellow-600' },
          { label: 'Avg Battery',   value: `${avgBattery}%`,   icon: <BoltIcon               className="h-8 w-8 text-yellow-500" />, color: 'text-yellow-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
              {icon}
            </div>
          </div>
        ))}
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
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
                        {getTypeIcon(device.type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{device.deviceId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTypeLabel(device.type)}
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
                    <span className={getStatusBadge(device.status)}>{device.status}</span>
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
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No devices found. Click "Register Device" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            trucks={allTrucks}          // ← All trucks (support multiple devices per truck)
            onAssign={handleAssignTruck}
            onClose={() => setAssigningDevice(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Devices;