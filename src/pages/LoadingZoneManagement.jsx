import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadingZoneService } from '../services/loadingZoneService';
import { trackingService } from '../services/trackingService';
import StatCard from '../components/Cards/StatCard';
import PaginationComponent from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';
import {
  PlusIcon, PencilIcon, TrashIcon, EyeIcon,
  FunnelIcon, ArrowPathIcon, MapPinIcon,
  CheckCircleIcon, XCircleIcon, BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import LoadingZoneFormModal from '../components/LoadingZones/LoadingZoneFormModal';
import LoadingZoneDetailsModal from '../components/LoadingZones/LoadingZoneDetailsModal';

// ============================================
// Module-level cache — persists across page
// changes without re-geocoding same coordinates
// ============================================
const geocodeCache = new Map();

// ============================================
// ✅ Defined OUTSIDE the parent component so
//    React sees a stable component identity
//    and hooks work correctly across renders
// ============================================
const LocationName = ({ lat, lng }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const key = `${lat},${lng}`;

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); return; }

    if (geocodeCache.has(key)) {
      setName(geocodeCache.get(key));
      setLoading(false);
      return;
    }

    trackingService.reverseGeocode(lat, lng)
      .then(result => {
        const resolved = result.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        geocodeCache.set(key, resolved);
        setName(resolved);
      })
      .catch(() => setName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`))
      .finally(() => setLoading(false));
  }, [key, lat, lng]);

  if (!lat || !lng) return <span className="text-gray-400">—</span>;

  if (loading) return (
    <span className="flex items-center gap-1 text-gray-400">
      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400" />
      <span className="text-xs">Locating...</span>
    </span>
  );

  return (
    <span className="flex items-center gap-1 text-sm text-gray-700" title={`${lat}, ${lng}`}>
      <MapPinIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      {name}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const LoadingZoneManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', search: '' });
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 10);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  const { data: zonesData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['loadingZones', filters, page, limit],
    queryFn: () => loadingZoneService.getAll({ ...filters, page, limit }),
    keepPreviousData: true,
    staleTime: 5000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['loadingZonesStats'],
    queryFn: () => loadingZoneService.getStats(),
  });

  const zones      = zonesData?.data || [];
  const pagination = zonesData?.pagination || { total: 0, page: 1, pages: 1 };
  const stats      = statsData?.data || statsData?.stats || { total: 0, active: 0, inactive: 0 };

  const deleteMutation = useMutation({
    mutationFn: loadingZoneService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['loadingZones']);
      queryClient.invalidateQueries(['loadingZonesStats']);
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete loading zone "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const resetFilters = () => {
    setFilters({ status: '', search: '' });
    setPage(1);
  };

  const getStatusBadge = (status) =>
    status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  if (isLoading && !zonesData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
              <BuildingOfficeIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-500 text-sm font-medium animate-pulse">
              Loading Zones...
            </p>
          </div>
          );
        } 

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error loading loading zones: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loading Zone Management</h1>
          <p className="text-gray-600 mt-1">Manage loading/unloading areas for shipment tracking</p>
        </div>
        <button
          onClick={() => { setEditingZone(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Loading Zone
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Zones"    value={stats.total}    icon={BuildingOfficeIcon} color="purple" subtitle="Registered loading zones"  />
        <StatCard title="Active Zones"   value={stats.active}   icon={CheckCircleIcon}    color="green"  subtitle="Currently operational"      />
        <StatCard title="Inactive Zones" value={stats.inactive} icon={XCircleIcon}        color="gray"   subtitle="Temporarily closed"         />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              placeholder="Search by name or description..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors">
              <FunnelIcon className="h-4 w-4" /> Reset Filters
            </button>
            <button onClick={() => refetch()} className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors">
              <ArrowPathIcon className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
        {isFetching && (
          <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            Loading...
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Radius</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No loading zones found
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {zone.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">{zone.description || '—'}</div>
                    </td>
                    {/* ✅ Clean td — no stray comments or text nodes */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <LocationName lat={zone.location?.lat} lng={zone.location?.lng} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {zone.radiusMeters}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(zone.status)}`}>
                        {zone.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button onClick={() => setSelectedZone(zone)} className="text-blue-600 hover:text-blue-800 transition-colors" title="View Details">
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => { setEditingZone(zone); setShowForm(true); }} className="text-green-600 hover:text-green-800 transition-colors" title="Edit">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(zone._id, zone.name)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.total > 0 && (
          <div className="mt-6 px-6 py-4 border-t">
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
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <LoadingZoneFormModal
          zone={editingZone}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries(['loadingZones']);
            queryClient.invalidateQueries(['loadingZonesStats']);
          }}
        />
      )}

      {selectedZone && (
        <LoadingZoneDetailsModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
};

export default LoadingZoneManagement;