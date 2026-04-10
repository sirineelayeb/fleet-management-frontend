import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { truckService } from '../services/truckService';
import toast from 'react-hot-toast';
import Modal from '../components/Common/Modal';
import {
  UserIcon, TruckIcon, PencilIcon, TrashIcon, PlusIcon,
  CheckBadgeIcon, CalendarIcon, PhoneIcon, PhotoIcon,
  ArrowUpTrayIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon,
  XCircleIcon, DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

// ============================================
// CONSTANTS & HELPERS
// ============================================
const BASE_URL = 'http://localhost:5000';
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  name: '',
  phone: '',
  licenseNumber: '',
  status: 'available',
  hireDate: new Date().toISOString().split('T')[0],
};

const resolvePhotoUrl = (url) => {
  if (!url) return null;
  const normalized = url.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) return `${BASE_URL}/${normalized.slice(uploadsIndex)}`;
  return `${BASE_URL}/${normalized.replace(/^\//, '')}`;
};

const getStatusBadge = (status) => ({
  available: 'bg-green-100 text-green-800',
  busy: 'bg-yellow-100 text-yellow-800',
  off_duty: 'bg-gray-100 text-gray-800',
}[status] || 'bg-gray-100 text-gray-800');

const getStatusText = (status) => ({
  available: 'Available',
  busy: 'Busy',
  off_duty: 'Off Duty',
}[status] || status);

const safeExtractArray = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  return [];
};

// ============================================
// SUB-COMPONENTS
// ============================================
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

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
        className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <span className="px-4 py-2 text-sm">Page {page} of {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
        className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
    <Icon className={`h-8 w-8 ${color}`} />
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const Drivers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Assign truck modal state
  const [showAssignTruckModal, setShowAssignTruckModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTruckId, setSelectedTruckId] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: driversData, isLoading, error: driversError } = useQuery({
    queryKey: ['drivers', page],
    queryFn: () => driverService.getAll({ page, limit: PAGE_SIZE }),
    retry: 1,
  });

  const { data: trucksResponse, isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000 }),
    retry: 1,
  });

  // ── Safe extraction ───────────────────────────────────────────────────────
  const drivers = safeExtractArray(driversData);
  const trucks = safeExtractArray(trucksResponse);
  const pagination = driversData?.pagination || { total: 0, page: 1, pages: 1 };

  const availableTrucks = trucks.filter(t => t.status === 'available' && !t.driver);

  const stats = {
    total: pagination.total || drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    busy: drivers.filter(d => d.status === 'busy').length,
    assigned: drivers.filter(d => d.assignedTruck).length,
  };

  // ── Photo helpers ─────────────────────────────────────────────────────────
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

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => driverService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Driver created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create driver'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => driverService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Driver updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update driver'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => driverService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      queryClient.invalidateQueries(['trucks']);
      queryClient.invalidateQueries(['trucks-all']);
      toast.success('Driver deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete driver'),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ id, file }) => driverService.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Photo uploaded');
      clearPhoto();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload photo'),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id) => driverService.deletePhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Photo removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove photo'),
  });

  const assignTruckMutation = useMutation({
    mutationFn: ({ truckId, driverId }) => truckService.assignDriver(truckId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      queryClient.invalidateQueries(['trucks']);
      queryClient.invalidateQueries(['trucks-all']);
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
      queryClient.invalidateQueries(['drivers']);
      queryClient.invalidateQueries(['trucks']);
      queryClient.invalidateQueries(['trucks-all']);
      toast.success('Truck unassigned successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to unassign truck'),
  });

  // ── Modal handlers ────────────────────────────────────────────────────────
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setFormData(EMPTY_FORM);
    clearPhoto();
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      status: driver.status || 'available',
      hireDate: driver.hireDate
        ? new Date(driver.hireDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
    clearPhoto();
    setIsModalOpen(true);
  };

  // ── Assign / Unassign truck handlers ──────────────────────────────────────
  const openAssignTruckModal = (driver) => {
    setSelectedDriver(driver);
    setSelectedTruckId('');
    setShowAssignTruckModal(true);
  };

  const handleAssignTruck = async () => {
    if (!selectedTruckId) return toast.error('Please select a truck');
    if (!selectedDriver?._id) return toast.error('Invalid driver selected');
    try {
      await assignTruckMutation.mutateAsync({
        truckId: selectedTruckId,
        driverId: selectedDriver._id,
      });
    } catch (err) { /* handled in mutation */ }
  };

  const handleUnassignTruck = async (driver) => {
    const truckId = driver.assignedTruck?._id ?? driver.assignedTruck;
    if (!truckId) return;
    if (window.confirm(`Remove truck from ${driver.name}?`)) {
      try {
        await unassignTruckMutation.mutateAsync(truckId);
      } catch (err) { /* handled in mutation */ }
    }
  };

  // ── Submit (create / edit driver only — no truck assignment here) ─────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Driver name is required');
    if (!formData.licenseNumber.trim()) return toast.error('License number is required');
    if (!formData.phone.trim()) return toast.error('Phone number is required');

    const submitData = {
      name: formData.name.trim(),
      licenseNumber: formData.licenseNumber.trim().toUpperCase(),
      phone: formData.phone.trim(),
      status: formData.status,
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

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (driversError) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <p className="text-red-600">Error loading drivers: {driversError.message}</p>
      <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg">
        Retry
      </button>
    </div>
  );

  const isSaving = createMutation.isPending || updateMutation.isPending || photoUploading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-1">{pagination.total} drivers total</p>
        </div>
        <button
          onClick={() => { setEditingDriver(null); setFormData(EMPTY_FORM); clearPhoto(); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Driver
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Drivers" value={stats.total} icon={UserIcon} color="text-blue-500" />
        <StatCard label="Available" value={stats.available} icon={CheckBadgeIcon} color="text-green-500" />
        <StatCard label="Busy" value={stats.busy} icon={CalendarIcon} color="text-yellow-500" />
        <StatCard label="Assigned to Truck" value={stats.assigned} icon={TruckIcon} color="text-purple-500" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Driver', 'License', 'Phone', 'Assigned Truck', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
                  {/* Driver */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <DriverAvatar driver={driver} size="md" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        <div className="text-xs text-gray-500">Score: {driver.score ?? 100}</div>
                      </div>
                    </div>
                  </td>

                  {/* License */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.licenseNumber}
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.phone}
                  </td>

                  {/* Assigned Truck */}
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
                        <button
                          onClick={() => handleUnassignTruck(driver)}
                          className="text-red-500 hover:text-red-700"
                          title="Unassign truck"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignTruckModal(driver)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <TruckIcon className="h-4 w-4" />
                        Assign Truck
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(driver.status)}`}>
                      {getStatusText(driver.status)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-3">
                    <button onClick={() => handleEdit(driver)} className="text-blue-600 hover:text-blue-900" title="Edit">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <Link
                      to={`/dashboard/driver-history/${driver._id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View history"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${driver.name}?`)) {
                          deleteMutation.mutate(driver._id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No drivers found. Click "Add New Driver" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination page={pagination.page} totalPages={pagination.pages} onPageChange={setPage} />

      {/* ── Add / Edit Driver Modal ── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingDriver ? 'Edit Driver' : 'Add New Driver'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
              <input type="text" value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off Duty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
              <input type="date" value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {!editingDriver && photoFile && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <PhotoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Driver will be created first, then the photo will be uploaded automatically.</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={closeModal}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
              {isSaving
                ? (photoUploading ? 'Uploading photo…' : 'Saving…')
                : (editingDriver ? 'Update Driver' : 'Create Driver')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Truck Modal ── */}
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
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignTruck}
              disabled={!selectedTruckId || assignTruckMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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