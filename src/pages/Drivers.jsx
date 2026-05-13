// frontend/src/pages/Drivers.jsx
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { truckService } from '../services/truckService';
import toast from 'react-hot-toast';
import Modal from '../components/Common/Modal';
import PaginationComponent from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';
import StatCard from '../components/Cards/StatCard';
import {
  UserIcon, TruckIcon, PencilIcon, PlusIcon,
  CheckBadgeIcon, CalendarIcon, PhoneIcon, PhotoIcon,
  ArrowUpTrayIcon, XMarkIcon, XCircleIcon, DocumentTextIcon,
  MagnifyingGlassIcon, IdentificationIcon, UserGroupIcon,
  CheckCircleIcon, ClockIcon, EnvelopeIcon,
  ArchiveBoxArrowDownIcon, ArrowUturnLeftIcon  // NEW
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import PhoneInputField from '../components/Common/PhoneInputField';
import { isValidPhoneNumber } from 'react-phone-number-input';  

// ============================================
// CONSTANTS & HELPERS
// ============================================

const EMPTY_FORM = {
  cin: '',
  name: '',
  licenseNumber: '',
  phone: '',
  email: '',
  hireDate: new Date().toISOString().split('T')[0],
};

// Helper to resolve photo URL
const resolvePhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const normalized = url.replace(/\\/g, '/');
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) return `${import.meta.env.VITE_API_URL}/${normalized.slice(uploadsIndex)}`;
  return url;
};

// Status select component
const StatusSelect = ({ status, onStatusChange, driverId, isUpdating }) => {
  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== status) onStatusChange(driverId, newStatus);
  };

  const getStatusStyle = (value) => {
    switch (value) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'busy': return 'bg-yellow-100 text-yellow-700';
      case 'off_duty': return 'bg-gray-100 text-gray-700';
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
        <option value="available">Available</option>
        <option value="busy">Busy</option>
        <option value="off_duty">Off Duty</option>
      </select>
      {isUpdating && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>}
    </div>
  );
};

// DriverAvatar (unchanged)
const DriverAvatar = ({ driver, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'lg' ? 'h-20 w-20 text-xl' : 'h-10 w-10 text-sm';
  const photoUrl = resolvePhotoUrl(driver.photo?.url);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={driver.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white`}
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = driver.name?.charAt(0)?.toUpperCase() || '?';
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
  const color = colors[(driver.name?.charCodeAt(0) ?? 0) % colors.length];

  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center ring-2 ring-white`}>
      <span className="text-white font-semibold">{initials}</span>
    </div>
  );
};

// PhotoPicker (unchanged)
const PhotoPicker = ({ preview, existingUrl, onSelect, onRemove, onDeleteExisting }) => {
  const inputRef = useRef(null);
  const resolvedExisting = resolvePhotoUrl(existingUrl);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        {preview ? (
          <>
            <img src={preview} alt="preview" className="h-20 w-20 rounded-full object-cover border-2 border-blue-400" />
            <button type="button" onClick={onRemove} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </>
        ) : resolvedExisting ? (
          <>
            <img src={resolvedExisting} alt="current" className="h-20 w-20 rounded-full object-cover border-2 border-gray-300" />
            <button type="button" onClick={onDeleteExisting} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            <PhotoIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      <div>
        <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
          <ArrowUpTrayIcon className="h-4 w-4" />
          {preview || resolvedExisting ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="text-xs text-gray-500 mt-1">JPG or PNG · max 5 MB</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) onSelect(e.target.files[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const Drivers = () => {
  const queryClient = useQueryClient();
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  // New: archive filter state
  const [filters, setFilters] = useState({ status: '', search: '', archived: false });  // default: current drivers
  const [searchInput, setSearchInput] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Assign truck modal state (unchanged)
  const [showAssignTruckModal, setShowAssignTruckModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTruckId, setSelectedTruckId] = useState('');

  // Queries with pagination and archive filter
  const { 
    data: driversData, 
    isLoading, 
    isFetching,
    error: driversError 
  } = useQuery({
    queryKey: ['drivers', page, limit, filters.status, filters.search, filters.archived],
    queryFn: () => {
      const params = {
        page, 
        limit,
        status: filters.status || undefined,
        search: filters.search || undefined
      };
      // Send archived flag only if defined (true/false)
      if (filters.archived !== undefined) {
        params.archived = filters.archived;   // backend will use isActive accordingly
      }
      return driverService.getAll(params);
    },
    keepPreviousData: true,
    staleTime: 5000,
  });

  const { data: trucksResponse, isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000 }),
  });

  const drivers = driversData?.data || [];
  const pagination = driversData?.pagination || { total: 0, page: 1, pages: 1 };
  const trucks = trucksResponse?.data || [];

  // Filter available trucks (available status and no driver assigned)
  const availableTrucks = trucks.filter(t => t.status === 'available' && !t.driver);

  // Stats (based on current page data)
  const stats = {
    total: pagination.total || 0,
    available: drivers.filter(d => d.status === 'available').length,
    busy: drivers.filter(d => d.status === 'busy').length,
    offDuty: drivers.filter(d => d.status === 'off_duty').length,
    assigned: drivers.filter(d => d.assignedTruck).length,
    unassigned: drivers.filter(d => !d.assignedTruck && d.status !== 'off_duty').length,
  };

  // Search handlers with archive filter
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
    else archivedValue = false;   // current drivers
    setFilters(prev => ({ ...prev, archived: archivedValue }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({ status: '', search: '', archived: false });
    setSearchInput('');
    setPage(1);
  };

  // Mutations – replaced delete with archive/unarchive
  const createMutation = useMutation({
    mutationFn: (data) => driverService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create driver'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => driverService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update driver'),
  });

  // NEW: archive and unarchive mutations
  const archiveMutation = useMutation({
    mutationFn: (id) => driverService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver archived');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to archive driver'),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id) => driverService.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver restored');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to restore driver'),
  });

  // DELETE mutation removed – no permanent delete

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ id, file }) => driverService.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Photo uploaded');
      clearPhoto();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload photo'),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id) => driverService.deletePhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Photo removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove photo'),
  });

  const assignTruckMutation = useMutation({
    mutationFn: ({ truckId, driverId }) => truckService.assignDriver(truckId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['trucks-all'] });
      toast.success('Truck assigned successfully');
      setShowAssignTruckModal(false);
      setSelectedDriver(null);
      setSelectedTruckId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to assign truck'),
  });

  const unassignTruckMutation = useMutation({
    mutationFn: (truckId) => truckService.unassignDriver(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['trucks-all'] });
      toast.success('Truck unassigned successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to unassign truck'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => driverService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Status updated');
      setUpdatingStatusId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
      setUpdatingStatusId(null);
    }
  });

  // Handlers
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setFormData(EMPTY_FORM);
    clearPhoto();
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      cin: driver.cin || '',
      name: driver.name || '',
      licenseNumber: driver.licenseNumber || '',
      phone: driver.phone || '',
      email: driver.email || '',
      hireDate: driver.hireDate ? new Date(driver.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    clearPhoto();
    setIsModalOpen(true);
  };

  const openAssignTruckModal = (driver) => {
    setSelectedDriver(driver);
    setSelectedTruckId('');
    setShowAssignTruckModal(true);
  };

  const handleAssignTruck = async () => {
    if (!selectedTruckId) {
      toast.error('Please select a truck');
      return;
    }
    if (!selectedDriver?._id) {
      toast.error('Invalid driver selected');
      return;
    }
    await assignTruckMutation.mutateAsync({
      truckId: selectedTruckId,
      driverId: selectedDriver._id,
    });
  };

  const handleUnassignTruck = async (driver) => {
    const truckId = driver.assignedTruck?._id ?? driver.assignedTruck;
    if (!truckId) return;
    if (window.confirm(`Remove truck from ${driver.name}?`)) {
      await unassignTruckMutation.mutateAsync(truckId);
    }
  };

  const handleStatusUpdate = (driverId, newStatus) => {
    setUpdatingStatusId(driverId);
    updateStatusMutation.mutate({ id: driverId, status: newStatus });
  };

  // Archive / Unarchive handlers
  const handleArchive = (id) => {
    if (window.confirm('Archive this driver?')) archiveMutation.mutate(id);
  };
  const handleUnarchive = (id) => {
    if (window.confirm('Restore this driver?')) unarchiveMutation.mutate(id);
  };

  // Photo helpers
  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };
  const handlePhotoSelect = (file) => {
    clearPhoto();
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Submit (create / edit driver)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cin.trim()) return toast.error('CIN is required');
    if (!formData.name.trim()) return toast.error('Driver name is required');
    if (!formData.licenseNumber.trim()) return toast.error('License number is required');
    if (!formData.phone || !isValidPhoneNumber(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    const submitData = {
      cin: formData.cin.trim(),
      name: formData.name.trim(),
      licenseNumber: formData.licenseNumber.trim().toUpperCase(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      hireDate: formData.hireDate,
    };

    try {
      let driverId;

      if (editingDriver) {
        await updateMutation.mutateAsync({ id: editingDriver._id, data: submitData });
        driverId = editingDriver._id;
      } else {
        const res = await createMutation.mutateAsync(submitData);
        driverId = res?.data?._id || res?._id;
      }

      if (photoFile && driverId) {
        setPhotoUploading(true);
        await uploadPhotoMutation.mutateAsync({ id: driverId, file: photoFile });
        setPhotoUploading(false);
      }

      closeModal();
    } catch (err) {
      console.error('Submit error:', err);
      setPhotoUploading(false);
    }
  };

  // Loading / error states
  if (isLoading && !driversData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
          <UserIcon className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading Drivers...</p>
      </div>
    );
  }

  if (driversError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Error loading drivers: {driversError.message}</p>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || photoUploading;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet drivers</p>
        </div>
        <button
          onClick={() => { setEditingDriver(null); setFormData(EMPTY_FORM); clearPhoto(); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Driver
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <StatCard title="Total Drivers" value={stats.total} icon={UserGroupIcon} color="purple" subtitle="Total workforce" />
        <StatCard title="Available" value={stats.available} icon={CheckCircleIcon} color="green" subtitle="Ready for assignments" />
        <StatCard title="Busy" value={stats.busy} icon={ClockIcon} color="yellow" subtitle="Currently on duty" />
        <StatCard title="Off Duty" value={stats.offDuty} icon={CalendarIcon} color="gray" subtitle="Not available" />
        <StatCard title="Assigned to Truck" value={stats.assigned} icon={TruckIcon} color="blue" subtitle="With vehicle assigned" />
        <StatCard title="Unassigned" value={stats.unassigned} icon={UserIcon} color="orange" subtitle="Without vehicle" />
      </div>

      {/* Search & Filter Bar – added archive filter dropdown */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name, CIN, license, phone, or email..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5" />
                Search
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off_duty">Off Duty</option>
            </select>
          </div>

          {/* NEW: Archive filter dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archive</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.archived === undefined ? 'all' : filters.archived === true ? 'archived' : 'current'}
              onChange={(e) => handleArchiveFilter(e.target.value)}
            >
              <option value="all">All Drivers</option>
              <option value="current">Current Drivers</option>
              <option value="archived">Archived Drivers</option>
            </select>
          </div>
          
          {(filters.status || filters.search || filters.archived !== false) && (
            <div className="flex items-end">
              <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drivers Table */}
      {isFetching ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center" style={{ minHeight: 320 }}>
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400 font-medium">Loading drivers...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Driver', 'CIN', 'License', 'Phone', 'Email', 'Assigned Truck', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers.map((driver) => (
                    <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <DriverAvatar driver={driver} size="md" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                            <div className="text-xs text-gray-500">Score: {driver.score ?? 100}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.cin || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.licenseNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.email ? (
                          <div className="flex items-center gap-1">
                            <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{driver.email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {driver.assignedTruck ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <TruckIcon className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {driver.assignedTruck?.licensePlate ?? 'Assigned'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {driver.assignedTruck?.brand} {driver.assignedTruck?.model}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => handleUnassignTruck(driver)} className="text-red-500 hover:text-red-700" title="Unassign truck">
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => openAssignTruckModal(driver)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <TruckIcon className="h-4 w-4" />
                            Assign Truck
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusSelect
                          status={driver.status}
                          driverId={driver._id}
                          onStatusChange={handleStatusUpdate}
                          isUpdating={updatingStatusId === driver._id}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-3">
                        <button onClick={() => handleEdit(driver)} className="text-blue-600 hover:text-blue-900" title="Edit">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <Link to={`/dashboard/driver-history/${driver._id}`} className="text-indigo-600 hover:text-indigo-900" title="View history">
                          <DocumentTextIcon className="h-5 w-5" />
                        </Link>
                        {/* Show Archive or Restore based on current filter */}
                        {filters.archived === true ? (
                          <button onClick={() => handleUnarchive(driver._id)} className="text-green-600 hover:text-green-800" title="Restore">
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button onClick={() => handleArchive(driver._id)} className="text-orange-600 hover:text-orange-800" title="Archive">
                            <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                          </button>
                        )}
                       </td>
                     </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        No drivers found. Click "Add New Driver" to get started.
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

      {/* Add/Edit Driver Modal (unchanged) */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingDriver ? 'Edit Driver' : 'Add New Driver'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile photo section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">Profile Photo</p>
            <PhotoPicker
              preview={photoPreview}
              existingUrl={editingDriver?.photo?.url}
              onSelect={handlePhotoSelect}
              onRemove={clearPhoto}
              onDeleteExisting={() => {
                if (editingDriver && window.confirm('Remove photo?')) {
                  deletePhotoMutation.mutate(editingDriver._id);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CIN (National ID) *</label>
              <input 
                type="text" 
                value={formData.cin}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value.replace(/\D/g, '') })}
                placeholder="12345678"
                maxLength="8"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
              <input 
                type="text" 
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <PhoneInputField
              label="Phone"
              required
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val || '' })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="driver@fleet.com"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
              <input 
                type="date" 
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>

          {!editingDriver && photoFile && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <PhotoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Driver will be created first, then the photo will be uploaded automatically.</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
              {isSaving ? (photoUploading ? 'Uploading photo…' : 'Saving…') : (editingDriver ? 'Update Driver' : 'Create Driver')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Truck Modal (unchanged) */}
      <Modal
        isOpen={showAssignTruckModal}
        onClose={() => {
          setShowAssignTruckModal(false);
          setSelectedDriver(null);
          setSelectedTruckId('');
        }}
        title={`Assign Truck to ${selectedDriver?.name || 'Driver'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Truck</label>
            <select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a truck...</option>
              {availableTrucks.map(truck => (
                <option key={truck._id} value={truck._id}>
                  {truck.licensePlate} – {truck.brand} {truck.model} ({truck.type})
                </option>
              ))}
            </select>
            {availableTrucks.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No available trucks. All available trucks already have drivers assigned.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAssignTruckModal(false);
                setSelectedDriver(null);
                setSelectedTruckId('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignTruck}
              disabled={!selectedTruckId || assignTruckMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {assignTruckMutation.isPending ? 'Assigning...' : 'Assign Truck'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Drivers;