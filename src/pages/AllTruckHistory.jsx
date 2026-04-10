import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripHistoryService } from '../services/tripHistoryService';
import { Link } from 'react-router-dom';
import { TruckIcon, MapPinIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const AllTruckHistory = () => {
  const { data: tripsData, isLoading, error } = useQuery({
    queryKey: ['allTrips'],
    queryFn: () => tripHistoryService.getAllTrips(),
    onError: () => toast.error('Failed to load trips'),
  });

  // Robust extraction: handle different response structures
  let trips = [];
  if (tripsData) {
    if (Array.isArray(tripsData.data)) {
      trips = tripsData.data;
    } else if (tripsData.data?.trips && Array.isArray(tripsData.data.trips)) {
      trips = tripsData.data.trips;
    } else if (Array.isArray(tripsData)) {
      trips = tripsData;
    } else if (tripsData.trips && Array.isArray(tripsData.trips)) {
      trips = tripsData.trips;
    }
  }

  console.log('AllTruckHistory - tripsData:', tripsData);
  console.log('AllTruckHistory - extracted trips:', trips);

  // Group trips by truck
  const trucksMap = new Map();

  trips.forEach(trip => {
    const truckId = trip.truck?._id || trip.truck;
    if (!truckId) return;
    if (!trucksMap.has(truckId)) {
      trucksMap.set(truckId, {
        id: truckId,
        licensePlate: trip.truck?.licensePlate || 'Unknown',
        brand: trip.truck?.brand || '',
        model: trip.truck?.model || '',
        trips: [],
      });
    }
    trucksMap.get(truckId).trips.push(trip);
  });

  const trucks = Array.from(trucksMap.values());

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error loading truck history.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Truck History</h1>
      <div className="grid gap-6">
        {trucks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <TruckIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No trips recorded for any truck yet.</p>
          </div>
        ) : (
          trucks.map(truck => (
            <div key={truck.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-3">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold">{truck.licensePlate}</h2>
                    <p className="text-sm text-gray-500">{truck.brand} {truck.model}</p>
                  </div>
                </div>
                <Link
                  to={`/dashboard/truck-history/${truck.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all trips for this truck →
                </Link>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Recent trips</h3>
                {truck.trips.length === 0 ? (
                  <p className="text-gray-400 text-sm">No trips yet.</p>
                ) : (
                  truck.trips.slice(0, 5).map(trip => (
                    <div key={trip._id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between text-sm">
                        <span className="font-mono text-gray-600">{trip.tripNumber}</span>
                        <span className="text-gray-400">{new Date(trip.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
                        <MapPinIcon className="h-3 w-3 text-green-500" />
                        <span>{trip.origin}</span>
                        <span>→</span>
                        <MapPinIcon className="h-3 w-3 text-red-500" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>📏 {trip.actualDistanceKm?.toFixed(1) || 0} km</span>
                        <span>⏱️ {trip.actualDurationHours?.toFixed(1) || 0} h</span>
                      </div>
                    </div>
                  ))
                )}
                {truck.trips.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+ {truck.trips.length - 5} more trips</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllTruckHistory;