import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { truckService } from '../services/truckService';
import { driverService } from '../services/driverService';
import { deviceService } from '../services/deviceService';
import toast from 'react-hot-toast';
import TruckForm from '../components/Forms/TruckForm';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  XMarkIcon,
  CpuChipIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 10;

const Trucks = () => {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignDeviceModal, setShowAssignDeviceModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
  const queryClient = useQueryClient();

  // ── Queries with pagination ────────────────────────────────────────────────
const { data: trucksData, isLoading: trucksLoading } = useQuery({
  queryKey: ['trucks', page],
  queryFn: () => truckService.getAll({ page, limit: PAGE_SIZE }),
});

console.log('trucksData from useQuery:', trucksData);

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driverService.getAll(),
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAll(),
  });

  // ── Safe array extraction ────────────────────────────────────────────────────
  const trucks = Array.isArray(trucksData?.data) ? trucksData.data
    : Array.isArray(trucksData) ? trucksData
    : [];
    
  const pagination = trucksData?.pagination || { total: 0, page: 1, pages: 1 };

  const drivers = Array.isArray(driversData?.data) ? driversData.data
    : Array.isArray(driversData) ? driversData
    : [];

  const devices = Array.isArray(devicesData?.data) ? devicesData.data
    : Array.isArray(devicesData) ? devicesData
    : [];

  // ── Filter available drivers (status = 'available' and unassigned) ───────────
  const availableDrivers = drivers.filter(d => {
    if (d.status !== 'available') return false;
    if (!d.assignedTruck) return true;
    const assignedId = d.assignedTruck?._id ?? d.assignedTruck;
    return editingTruck && assignedId?.toString() === editingTruck._id?.toString();
  });

  // ── Filter available devices (unassigned to any truck) ───────────────────────
  const availableDevices = devices.filter(d => {
    if (!d.truck) return true;
    const assignedId = d.truck?._id ?? d.truck;
    return editingTruck && assignedId?.toString() === editingTruck._id?.toString();
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => truckService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Truck created successfully');
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create truck');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => truckService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Truck updated successfully');
      setIsModalOpen(false);
      setEditingTruck(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update truck');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => truckService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Truck deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete truck');
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ truckId, driverId }) => truckService.assignDriver(truckId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver assigned successfully');
      setShowAssignModal(false);
      setSelectedTruck(null);
      setSelectedDriverId('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign driver');
    },
  });

  const unassignDriverMutation = useMutation({
    mutationFn: (truckId) => truckService.unassignDriver(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver unassigned successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unassign driver');
    },
  });

  const assignDeviceMutation = useMutation({
    mutationFn: ({ truckId, deviceId }) => truckService.assignDevice(truckId, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device assigned successfully');
      setShowAssignDeviceModal(false);
      setSelectedTruck(null);
      setSelectedDeviceId('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign device');
    },
  });

  const unassignDeviceMutation = useMutation({
    mutationFn: (truckId) => truckService.unassignDevice(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device unassigned successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unassign device');
    },
  });

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleSubmit = async (data) => {
    const { deviceId, ...truckData } = data; 
    try {
      let truckId;

      if (editingTruck) {
        await updateMutation.mutateAsync({ id: editingTruck._id, data: truckData });
        truckId = editingTruck._id;

        // Handle device assignment (if device changed)
        const currentDeviceId = editingTruck.device?._id?.toString() ?? editingTruck.device?.toString();
        const newDeviceId = deviceId?.toString();
        if (newDeviceId && newDeviceId !== currentDeviceId) {
          await assignDeviceMutation.mutateAsync({ truckId, deviceId: newDeviceId });
        } else if (!newDeviceId && currentDeviceId) {
          await unassignDeviceMutation.mutateAsync(truckId);
        }
      } else {
        const res = await createMutation.mutateAsync(truckData);
        truckId = res?.data?._id ?? res?._id;
        if (deviceId && truckId) {
          await assignDeviceMutation.mutateAsync({ truckId, deviceId });
        }
      }
    } catch (err) {

      // Errors already handled in mutation onError
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this truck?')) {
      deleteMutation.mutate(id);
    }
  };

  const openAssignDriverModal = (truck) => {
  setSelectedTruck(truck);
  setSelectedDriverId('');
  setShowAssignModal(true);
};

// ✅ ADD THIS MISSING FUNCTION
const handleAssignDriver = async () => {
  if (!selectedDriverId) {
    toast.error('Please select a driver');
    return;
  }
  
  if (!selectedTruck || !selectedTruck._id) {
    toast.error('Invalid truck selected');
    return;
  }

  try {
    await assignDriverMutation.mutateAsync({
      truckId: selectedTruck._id,
      driverId: selectedDriverId
    });
    // Success is handled in mutation onSuccess
  } catch (error) {
    // Error already handled in mutation onError
  }
};

const handleUnassignDriver = async (truck) => {
  if (!truck.driver) {
    toast.warning('This truck has no driver assigned');
    return;
  }

  if (window.confirm(`Remove ${truck.driver.name} from this truck?`)) {
    try {
      await unassignDriverMutation.mutateAsync(truck._id);
    } catch (error) {
      // Error already handled in mutation
    }
  }
};

  

const openAssignDeviceModal = (truck) => {
  setSelectedTruck(truck);  // truck is the full object
  setSelectedDeviceId('');
  setShowAssignDeviceModal(true);
};

const handleAssignDevice = async () => {
  if (!selectedDeviceId) {
    toast.error('Please select a device');
    return;
  }
  
  if (!selectedTruck || !selectedTruck._id) {
    toast.error('Invalid truck selected');
    return;
  }

  try {
    await truckService.assignDevice(selectedTruck._id, selectedDeviceId);
    toast.success('Device assigned successfully');
    setShowAssignDeviceModal(false);
    setSelectedTruck(null);
    setSelectedDeviceId('');
    queryClient.invalidateQueries(['trucks']);
    queryClient.invalidateQueries(['devices']);
  } catch (error) {
    console.error('Assignment error:', error);
    toast.error(error.response?.data?.message || 'Failed to assign device');
  }
};

  const handleUnassignDevice = async (truckId, deviceId) => {
    if (window.confirm('Remove this device from the truck?')) {
      try {
        await truckService.unassignDevice(truckId, deviceId); // backend expects deviceId
        queryClient.invalidateQueries(['trucks']);
        queryClient.invalidateQueries(['devices']);
        toast.success('Device unassigned');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to unassign device');
      }
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_mission: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return `px-2 py-1 text-xs rounded-full font-medium ${colors[status] ?? colors.inactive}`;
  };

  const getStatusText = (status) => ({
    available: 'Available',
    in_mission: 'In Mission',
    maintenance: 'Maintenance',
    inactive: 'Inactive',
  }[status] ?? status);

  // Pagination component
  const Pagination = () => {
    if (pagination.pages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="px-4 py-2 text-sm">
          Page {pagination.page} of {pagination.pages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
          disabled={page === pagination.pages}
          className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (trucksLoading || driversLoading || devicesLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trucks Management</h1>
          <p className="text-gray-500 mt-1">{pagination.total} trucks in fleet</p>
        </div>
        <button
          onClick={() => { setEditingTruck(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Truck
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Trucks</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🚛</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {trucks.filter(t => t.status === 'available').length}
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Mission</p>
              <p className="text-2xl font-bold text-blue-600">
                {trucks.filter(t => t.status === 'in_mission').length}
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {trucks.filter(t => t.status === 'maintenance').length}
              </p>
            </div>
            <span className="text-2xl">🔧</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Devices Assigned</p>
              <p className="text-2xl font-bold text-purple-600">
                {trucks.filter(t => t.device).length}
              </p>
            </div>
            <CpuChipIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['License Plate', 'Brand / Model', 'Year', 'Capacity', 'Driver', 'Device', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trucks.length > 0 ? trucks.map((truck) => (
                <tr key={truck._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {truck.displayPlate || truck.licensePlate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {truck.brand} {truck.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {truck.year || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {truck.capacity ? `${truck.capacity} t` : '—'}
                  </td>
                  {/* Driver Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {truck.driver ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {truck.driver.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {truck.driver.licenseNumber}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassignDriver(truck)}
                          className="text-red-600 hover:text-red-800"
                          title="Unassign driver"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignDriverModal(truck)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <UserIcon className="h-4 w-4" />
                        Assign Driver
                      </button>
                    )}
                  </td>
                  {/* Device Column */}
                 <td className="px-6 py-4 text-sm">
                  {truck.devices && truck.devices.length > 0 ? (
                    <div className="space-y-2">
                      {truck.devices.map(device => (
                        <div key={device._id} className="flex items-center justify-between gap-2 bg-gray-50 p-1 rounded">
                          <div className="flex items-center gap-2">
                            <CpuChipIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{device.deviceId}</p>
                              <p className="text-xs text-gray-500">{device.type || 'Device'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignDevice(truck._id, device._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Unassign this device"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => openAssignDeviceModal(truck)}
                      className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      <CpuChipIcon className="h-4 w-4" />
                      Assign Device
                    </button>
                  )}
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(truck.status)}>
                      {getStatusText(truck.status)}
                    </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-3">
                    <button
                      onClick={() => { setEditingTruck(truck); setIsModalOpen(true); }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                     <Link
                        to={`/dashboard/truck-history/${truck._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View trip history"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                      </Link>
                    <button
                      onClick={() => handleDelete(truck._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                   </td>
                 </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    No trucks found. Click "Add Truck" to create one.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination />

      {/* Truck Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTruck(null); }}
        title={editingTruck ? 'Edit Truck' : 'Add New Truck'}
        size="lg"
      >
        <TruckForm
          onSubmit={handleSubmit}
          initialData={editingTruck}
          drivers={availableDrivers}
          devices={availableDevices}
          onCancel={() => { setIsModalOpen(false); setEditingTruck(null); }}
        />
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedTruck(null);
          setSelectedDriverId('');
        }}
        title={`Assign Driver to ${selectedTruck?.licensePlate || 'Truck'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Driver
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a driver...</option>
              {drivers
                .filter(d => d.status === 'available' && !d.assignedTruck)
                .map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} - {driver.licenseNumber}
                  </option>
                ))
              }
            </select>
            {drivers.filter(d => d.status === 'available' && !d.assignedTruck).length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No available drivers. All available drivers are already assigned to trucks.
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedTruck(null);
                setSelectedDriverId('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignDriver}
              disabled={!selectedDriverId || assignDriverMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignDriverMutation.isPending ? 'Assigning...' : 'Assign Driver'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Device Modal */}
      <Modal
        isOpen={showAssignDeviceModal}
        onClose={() => {
          setShowAssignDeviceModal(false);
          setSelectedTruck(null);
          setSelectedDeviceId('');
        }}
        title={`Assign Device to ${selectedTruck?.licensePlate || 'Truck'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Device
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choose a device...</option>
              {devices
                .filter(d => !d.truck)
                .map(device => (
                  <option key={device._id} value={device._id}>
                    {device.deviceId} - {device.type || 'Device'} 
                    {device.status === 'active' ? ' ✓ Active' : ` (${device.status})`}
                  </option>
                ))
              }
            </select>
            {devices.filter(d => !d.truck).length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No available devices. All devices are already assigned to trucks.
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAssignDeviceModal(false);
                setSelectedTruck(null);
                setSelectedDeviceId('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignDevice}
              disabled={!selectedDeviceId || assignDeviceMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignDeviceMutation.isPending ? 'Assigning...' : 'Assign Device'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Trucks;  