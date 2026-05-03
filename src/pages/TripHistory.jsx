// frontend/src/pages/TripHistory.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripHistoryService } from '../services/tripHistoryService';
import TripDetailsModal from '../components/Trips/TripDetailsModal';
import Pagination from '../components/Common/Pagination';
import StatCard from '../components/Cards/StatCard';
import { usePagination } from '../hooks/usePagination';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  TruckIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  XMarkIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// ── Status Badge Component ───────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Completed' },
    in_progress: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, label: 'In Progress' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XMarkIcon, label: 'Cancelled' },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon, label: 'Pending' }
  };
  
  const { color, icon: Icon, label } = config[status] || { 
    color: 'bg-gray-100 text-gray-800', 
    icon: null, 
    label: status?.replace('_', ' ') 
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${color}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
};

// ── Trip Row Component - Only Important Fields ──────────────────────────────
const TripRow = ({ trip, onClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <tr 
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={() => onClick(trip)}
    >
      {/* Trip Number */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-mono font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {trip.tripNumber || trip._id?.slice(-8).toUpperCase() || '—'}
        </div>
      </td>
      
      {/* Route (Origin → Destination) */}
      <td className="px-4 py-3">
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[150px]">{trip.origin || '—'}</span>
            <span className="text-gray-400">→</span>
            <span className="truncate max-w-[150px]">{trip.destination || '—'}</span>
          </div>
        </div>
      </td>
      
      {/* Truck */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <TruckIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {trip.truck?.licensePlate || trip.truck?.displayPlate || '—'}
          </span>
        </div>
      </td>
      
      {/* Driver */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {trip.driver?.name || '—'}
          </span>
        </div>
      </td>
      
      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {formatDate(trip.startTime || trip.createdAt)}
          </span>
        </div>
      </td>
      
      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={trip.status} />
      </td>
      
      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(trip);
          }}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          View Details
        </button>
      </td>
    </tr>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const TripHistory = () => {
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 10);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Create stable filter object for query key ────────────────────────────
  const filters = useMemo(() => ({
    status: statusFilter,
    search: searchTerm,
  }), [statusFilter, searchTerm]);

  // ── Query with pagination and filters ────────────────────────────────────
  const { 
    data: tripsData, 
    isLoading, 
    isFetching,
    refetch,
    error 
  } = useQuery({
    queryKey: ['trips', page, limit, filters],
    queryFn: () => {
      const params = { 
        page, 
        limit,
        sort: '-createdAt'
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      return tripHistoryService.getAllTrips(params);
    },
    keepPreviousData: true,
    staleTime: 5000,
  });

  // ── Safe extraction ───────────────────────────────────────────────────────
  const trips = tripsData?.data || [];
  const pagination = tripsData?.pagination || { total: 0, page: 1, pages: 1 };

  // ── Statistics - Simplified ───────────────────────────────────────────────
  const stats = {
    total: pagination.total || 0,
    completed: trips.filter(t => t.status === 'completed').length,
    inProgress: trips.filter(t => t.status === 'in_progress').length,
    cancelled: trips.filter(t => t.status === 'cancelled').length,
  };

  // ── Search handlers ───────────────────────────────────────────────────────
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
  };

  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
    setShowModal(true);
  };

  // ── Pagination handlers ───────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    handleLimitChange(newSize);
  };

  const hasActiveFilters = statusFilter || searchTerm;

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading && !tripsData) {
   return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
              <TruckIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-500 text-sm font-medium animate-pulse">
              Loading Trips...
            </p>
          </div>
          );
        } 
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-600">Error loading trips: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
          <p className="text-gray-600 text-sm mt-1">Track and manage all delivery trips</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Refresh</span>
        </button>
      </div>

      {/* Statistics Cards - Light Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Trips"
          value={stats.total.toLocaleString()}
          icon={TruckIcon}
          color="light-purple"
          subtitle="All trips"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircleIcon}
          color="light-green"
          subtitle="Successfully delivered"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={ClockIcon}
          color="light-blue"
          subtitle="Active deliveries"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={XMarkIcon}
          color="light-red"
          subtitle="Failed deliveries"
        />
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by trip number, route, truck or driver..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          
          <button 
            onClick={handleSearch} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Search
          </button>
          
          {hasActiveFilters && (
            <button 
              onClick={clearFilters} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        {isFetching && (
          <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading trips...
          </div>
        )}
      </div>

      {/* Trip List Table - Only Important Fields */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {hasActiveFilters 
                ? 'No trips match your search criteria.' 
                : 'No trips found. Trips will appear here once shipments are assigned.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trips.map((trip) => (
                  <TripRow key={trip._id} trip={trip} onClick={handleTripClick} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page || 1}
          totalPages={pagination.pages || 1}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={limit}
          pageSizeOptions={[10, 25, 50, 100]}
          showFirstLast={true}
          siblingCount={1}
          showPageSizeSelector={true}
          totalItems={pagination.total || 0}
        />
      )}

      {/* Trip Details Modal */}
      {showModal && selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default TripHistory;