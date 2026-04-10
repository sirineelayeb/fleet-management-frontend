// frontend/src/pages/TripHistory.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripHistoryService } from '../services/tripHistoryService';
import TripDetailsModal from '../components/Trips/TripDetailsModal';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const TripHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: tripsData, isLoading, refetch } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripHistoryService.getAllTrips(),
    onError: () => toast.error('Failed to load trips'),
  });

  // ✅ Extract trips array from response – supports multiple structures
  const trips = useMemo(() => {
    if (!tripsData) return [];
    if (Array.isArray(tripsData)) return tripsData;
    if (tripsData.data && Array.isArray(tripsData.data)) return tripsData.data;
    if (tripsData.trips && Array.isArray(tripsData.trips)) return tripsData.trips;
    console.warn('Unexpected trips data structure:', tripsData);
    return [];
  }, [tripsData]);

  const totalTrips = tripsData?.pagination?.total || trips.length;

  const filteredTrips = useMemo(() => {
    let result = trips;
    if (filterStatus !== 'all') {
      result = result.filter(trip => trip.status === filterStatus);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(trip =>
        (trip.tripNumber?.toLowerCase().includes(term)) ||
        (trip.origin?.toLowerCase().includes(term)) ||
        (trip.destination?.toLowerCase().includes(term)) ||
        (trip.truck?.licensePlate?.toLowerCase().includes(term)) ||
        (trip.driver?.name?.toLowerCase().includes(term))
      );
    }
    return result;
  }, [trips, filterStatus, searchTerm]);

  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
    setShowModal(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trip History</h1>
          <p className="text-gray-500 mt-1">{totalTrips} total trips</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by trip number, origin, destination, truck or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trip List Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truck</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    No trips found.
                  </td>
                </tr>
              ) : (
                filteredTrips.map(trip => (
                  <tr key={trip._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {trip.tripNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="truncate max-w-xs">
                        {trip.origin} → {trip.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {trip.truck?.licensePlate || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {trip.driver?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {trip.actualDistanceKm?.toFixed(1) || 0} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {trip.actualDurationHours?.toFixed(1) || 0} h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                        trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        trip.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trip.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleTripClick(trip)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional Pagination – if needed, you can add it here using tripsData.pagination */}

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