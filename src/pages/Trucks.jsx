import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { truckService } from '../services/truckService';
import { driverService } from '../services/driverService';
import { deviceService } from '../services/deviceService';
import toast from 'react-hot-toast';
import TruckForm from '../components/Forms/TruckForm';
import PaginationComponent from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';

import {
  PlusIcon,
  PencilIcon,
  ArchiveBoxArrowDownIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  TruckIcon as TruckIconOutline,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import Modal from '../components/Common/Modal';
import StatCard from '../components/Cards/StatCard';
import { Link } from 'react-router-dom';

// Status select dropdown component
const StatusSelect = ({ status, onStatusChange, truckId, isUpdating }) => {
  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== status) {
      onStatusChange(truckId, newStatus);
    }
  };

  const getStatusStyle = (value) => {
    switch (value) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'in_mission':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={status}
        onChange={handleChange}
        disabled={isUpdating}
        className={`text-xs font-medium rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 ${getStatusStyle(
          status
        )}`}
      >
        <option value="available">Available</option>
        <option value="in_mission">In Mission</option>
        <option value="maintenance">Maintenance</option>
        <option value="inactive">Inactive</option>
      </select>
      {isUpdating && (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
      )}
    </div>
  );
};

const Trucks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignDeviceModal, setShowAssignDeviceModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 10);
  
  // Filters: status, search, and archived (true/false/undefined)
  const [filters, setFilters] = useState({ status: '', search: '', archived: false });
  const [searchInput, setSearchInput] = useState('');

  const queryClient = useQueryClient();

  // Query with archive filter integrated
  const {
    data: trucksData,
    isLoading: trucksLoading,
    isFetching,
  } = useQuery({
    queryKey: ['trucks', page, limit, filters.status, filters.search, filters.archived],
    queryFn: () =>
      truckService.getAll({
        page,
        limit,
        status: filters.status || undefined,
        search: filters.search || undefined,
        archived: filters.archived, // false = active only, true = archived only, undefined = all
      }),
    keepPreviousData: true,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driverService.getAll(),
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.getAll(),
  });

  // Safe array extraction
  const trucks = trucksData?.data || [];
  const pagination = trucksData?.pagination || { total: 0, page: 1, pages: 1 };
  const drivers = driversData?.data || [];
  const devices = devicesData?.data || [];

  // Stats based on current page (or you could use a separate stats endpoint)
  const stats = {
    total: pagination.total || 0,
    available: trucks.filter((t) => t.status === 'available').length,
    inMission: trucks.filter((t) => t.status === 'in_mission').length,
    maintenance: trucks.filter((t) => t.status === 'maintenance').length,
    inactive: trucks.filter((t) => t.status === 'inactive').length,
    withDevices: trucks.filter((t) => t.devices?.length > 0).length,
  };

  // Available drivers (unassigned)
  const availableDrivers = drivers.filter((d) => !d.assignedTruck);

  // Available devices (not assigned to any truck)
  const availableDevices = devices.filter((d) => !d.truck);

  // Handle search
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput }));
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStatusFilter = (status) => {
    setFilters((prev) => ({ ...prev, status }));
    setPage(1);
  };

  // Handle archive filter change (all / active / archived)
  const handleArchiveFilter = (value) => {
    let archivedValue;
    if (value === 'all') archivedValue = undefined;
    else if (value === 'archived') archivedValue = true;
    else archivedValue = false; // active
    setFilters((prev) => ({ ...prev, archived: archivedValue }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', search: '', archived: false });
    setSearchInput('');
    setPage(1);
  };

  // Mutations
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

  const archiveMutation = useMutation({
    mutationFn: (id) => truckService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Truck archived successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to archive truck');
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id) => truckService.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast.success('Truck restored successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to restore truck');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => truckService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast.success('Status updated');
      setUpdatingStatusId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
      setUpdatingStatusId(null);
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ truckId, driverId }) => truckService.assignDriver(truckId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver assigned');
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
      toast.success('Driver unassigned');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unassign driver');
    },
  });

  const assignDevicesMutation = useMutation({
    mutationFn: async ({ truckId, deviceIds }) => {
      for (const deviceId of deviceIds) {
        await truckService.assignDevice(truckId, deviceId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success(`${selectedDeviceIds.length} device(s) assigned`);
      setShowAssignDeviceModal(false);
      setSelectedTruck(null);
      setSelectedDeviceIds([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign devices');
    },
  });

  const unassignDeviceMutation = useMutation({
    mutationFn: ({ truckId, deviceId }) => truckService.unassignDevice(truckId, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device unassigned');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unassign device');
    },
  });

  // Handlers
  const handleSubmit = async (data) => {
    const { devices: newDevices, ...truckData } = data;

    try {
      let truckId;

      if (editingTruck) {
        await updateMutation.mutateAsync({ id: editingTruck._id, data: truckData });
        truckId = editingTruck._id;

        const currentDeviceIds =
          editingTruck.devices?.map((d) => d._id?.toString() || d.toString()) || [];
        const newDeviceIds = newDevices || [];

        const toAdd = newDeviceIds.filter((id) => !currentDeviceIds.includes(id));
        const toRemove = currentDeviceIds.filter((id) => !newDeviceIds.includes(id));

        for (const deviceId of toAdd) {
          await truckService.assignDevice(truckId, deviceId);
        }
        for (const deviceId of toRemove) {
          await truckService.unassignDevice(truckId, deviceId);
        }
      } else {
        const res = await createMutation.mutateAsync(truckData);
        truckId = res?.data?._id ?? res?._id;

        if (newDevices && newDevices.length > 0 && truckId) {
          for (const deviceId of newDevices) {
            await truckService.assignDevice(truckId, deviceId);
          }
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleArchive = (id) => {
    if (window.confirm('Archive this truck? It will no longer appear in the active fleet.')) {
      archiveMutation.mutate(id);
    }
  };

  const handleUnarchive = (id) => {
    if (window.confirm('Restore this truck to the active fleet?')) {
      unarchiveMutation.mutate(id);
    }
  };

  const handleStatusUpdate = (truckId, newStatus) => {
    setUpdatingStatusId(truckId);
    updateStatusMutation.mutate({ id: truckId, status: newStatus });
  };

  const openAssignDriverModal = (truck) => {
    setSelectedTruck(truck);
    setSelectedDriverId('');
    setShowAssignModal(true);
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      toast.error('Select a driver');
      return;
    }
    await assignDriverMutation.mutateAsync({
      truckId: selectedTruck._id,
      driverId: selectedDriverId,
    });
  };

  const handleUnassignDriver = async (truck) => {
    if (!truck.driver) return;
    if (window.confirm(`Remove ${truck.driver.name}?`)) {
      await unassignDriverMutation.mutateAsync(truck._id);
    }
  };

  const openAssignDeviceModal = (truck) => {
    setSelectedTruck(truck);
    setSelectedDeviceIds([]);
    setShowAssignDeviceModal(true);
  };

  const handleToggleDevice = (deviceId) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleAssignDevices = async () => {
    if (selectedDeviceIds.length === 0) {
      toast.error('Select at least one device');
      return;
    }
    await assignDevicesMutation.mutateAsync({
      truckId: selectedTruck._id,
      deviceIds: selectedDeviceIds,
    });
  };

  const handleUnassignDevice = async (truckId, deviceId) => {
    if (window.confirm('Remove this device?')) {
      await unassignDeviceMutation.mutateAsync({ truckId, deviceId });
    }
  };

  if (trucksLoading && !trucksData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
          <TruckIconOutline className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading Trucks...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trucks Management</h1>
          <p className="text-gray-500 mt-1">Manage your fleet of trucks</p>
        </div>
        <button
          onClick={() => {
            setEditingTruck(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add Truck
        </button>
      </div>

      {/* Stat Cards (based on current page data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <StatCard
          title="Total Trucks"
          value={stats.total}
          icon={TruckIconOutline}
          color="purple"
          subtitle="Total fleet size"
        />
        <StatCard
          title="Available"
          value={stats.available}
          icon={CheckCircleIcon}
          color="green"
          subtitle="Ready for missions"
        />
        <StatCard
          title="In Mission"
          value={stats.inMission}
          icon={ClockIcon}
          color="blue"
          subtitle="On the road"
        />
        <StatCard
          title="Maintenance"
          value={stats.maintenance}
          icon={XCircleIcon}
          color="yellow"
          subtitle="In workshop"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={XCircleIcon}
          color="red"
          subtitle="Out of service"
        />
        <StatCard
          title="With Devices"
          value={stats.withDevices}
          icon={CpuChipIcon}
          color="indigo"
          subtitle="IoT equipped"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap min-w-0">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by plate, brand, or model..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="in_mission">In Mission</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={
              filters.archived === undefined
                ? 'all'
                : filters.archived === true
                ? 'archived'
                : 'active'
            }
            onChange={(e) => handleArchiveFilter(e.target.value)}
          >
            <option value="all">All Trucks</option>
            <option value="active">Current Trucks</option>
            <option value="archived">Archived Trucks</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          {(filters.status || filters.search || filters.archived !== false) && (
            <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isFetching ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center" style={{ minHeight: 320 }}>
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400 font-medium">Loading trucks...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Plate', 'Model', 'Year', 'Capacity', 'Speed Limit', 'Driver', 'Devices', 'Status', 'Actions'].map(
                      (h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trucks.map((truck) => (
                    <tr key={truck._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {truck.displayPlate || truck.licensePlate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {truck.brand} {truck.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{truck.year || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{truck.capacity ? `${truck.capacity}t` : '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <BoltIcon className="h-4 w-4 text-blue-500" />
                          <span>{truck.speedLimit || 90} km/h</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {truck.driver ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span>{truck.driver.name}</span>
                            <button
                              onClick={() => handleUnassignDriver(truck)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignDriverModal(truck)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Assign Driver
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {truck.devices?.length > 0 ? (
                          <div className="space-y-1">
                            {truck.devices.map((device) => (
                              <div
                                key={device._id}
                                className="flex items-center justify-between gap-2 bg-gray-50 p-1 rounded"
                              >
                                <span className="text-xs">{device.deviceId}</span>
                                <button
                                  onClick={() => handleUnassignDevice(truck._id, device._id)}
                                  className="text-red-500"
                                >
                                  <XCircleIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignDeviceModal(truck)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            Assign Devices
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusSelect
                          status={truck.status}
                          truckId={truck._id}
                          onStatusChange={handleStatusUpdate}
                          isUpdating={updatingStatusId === truck._id}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditingTruck(truck);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-600"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <Link to={`/dashboard/truck-history/${truck._id}`} className="text-indigo-600">
                            <DocumentTextIcon className="h-5 w-5" />
                          </Link>
                          {filters.archived === true ? (
                            <button onClick={() => handleUnarchive(truck._id)} className="text-green-600">
                              <ArrowUturnLeftIcon className="h-5 w-5" />
                            </button>
                          ) : (
                            <button onClick={() => handleArchive(truck._id)} className="text-red-600">
                              <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {trucks.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                        No trucks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTruck ? 'Edit Truck' : 'Add Truck'}
        size="lg"
      >
        <TruckForm
          onSubmit={handleSubmit}
          initialData={editingTruck}
          devices={availableDevices}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Driver">
        <div className="space-y-4">
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select driver...</option>
            {availableDrivers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} - {d.licenseNumber}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button
              onClick={handleAssignDriver}
              disabled={!selectedDriverId}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Assign
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignDeviceModal}
        onClose={() => setShowAssignDeviceModal(false)}
        title="Assign Devices"
        size="md"
      >
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto border rounded">
            {availableDevices.map((device) => (
              <label
                key={device._id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b"
              >
                <input
                  type="checkbox"
                  checked={selectedDeviceIds.includes(device._id)}
                  onChange={() => handleToggleDevice(device._id)}
                  className="h-4 w-4"
                />
                <CpuChipIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">{device.deviceId}</p>
                  <p className="text-xs text-gray-500">Battery: {device.batteryLevel || 0}%</p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-sm">{selectedDeviceIds.length} selected</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAssignDeviceModal(false)} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button
              onClick={handleAssignDevices}
              disabled={selectedDeviceIds.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              Assign
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Trucks;