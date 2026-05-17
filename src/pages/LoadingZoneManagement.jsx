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
  CheckCircleIcon, XCircleIcon, BuildingOfficeIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingZoneFormModal from '../components/LoadingZones/LoadingZoneFormModal';
import LoadingZoneDetailsModal from '../components/LoadingZones/LoadingZoneDetailsModal';

// ============================================
// Module-level cache — persists across page
// changes without re-geocoding same coordinates
// ============================================
const geocodeCache = new Map();
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
  const [searchInput, setSearchInput] = useState('');
  
  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPage(1);
  };
  
  const resetFilters = () => {
    setFilters({ status: '', search: '' });
    setSearchInput('');
    setPage(1);
  };
  
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

  const getStatusBadge = (status) =>
    status === 'active' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600';

  if (isLoading && !zonesData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200 animate-pulse">
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
        <div className="text-rose-600">Error loading loading zones: {error.message}</div>
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
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Loading Zone
        </button>
      </div>

      {/* Stats - using teal/blue/orange palette from devices.jsx */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Zones"    value={stats.total}    icon={BuildingOfficeIcon} color="blue"   subtitle="Registered loading zones"  />
        <StatCard title="Active Zones"   value={stats.active}   icon={CheckCircleIcon}    color="teal"  subtitle="Currently operational"      />
        <StatCard title="Inactive Zones" value={stats.inactive} icon={XCircleIcon}        color="gray"  subtitle="Temporarily closed"         />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search by name or description..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Search
            </button>
          </div>

          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {(filters.status || filters.search) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => refetch()}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {isFetching ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center" style={{ minHeight: 320 }}>
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
            <p className="text-sm text-gray-400 font-medium">Loading zones...</p>
          </div>
        </div>
      ) : (
        <>
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
                          <button onClick={() => setSelectedZone(zone)} className="text-teal-600 hover:text-teal-800 transition-colors" title="View Details">
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => { setEditingZone(zone); setShowForm(true); }} className="text-teal-600 hover:text-teal-800 transition-colors" title="Edit">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(zone._id, zone.name)} className="text-rose-600 hover:text-rose-800 transition-colors" title="Delete">
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
        </>
      )}

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