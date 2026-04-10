// frontend/src/pages/TruckHistory.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tripHistoryService } from '../services/tripHistoryService';
import TripHistoryMap from '../components/Trips/TripHistoryMap';
import { truckService } from '../services/truckService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const TruckHistory = () => {
  const { truckId } = useParams();
  const navigate = useNavigate();

  // Fetch truck details
  const { data: truckData, isLoading: truckLoading } = useQuery({
    queryKey: ['truck', truckId],
    queryFn: () => truckService.getById(truckId),
    enabled: !!truckId,
  });

  // Fetch trips for this truck
  const { data: tripsData, isLoading: tripsLoading, error } = useQuery({
    queryKey: ['trips', 'truck', truckId],
    queryFn: () => tripHistoryService.getTruckTrips(truckId, { limit: 100 }),
    enabled: !!truckId,
  });

  const truck = truckData?.data;
  // Extract trips array – backend returns { success: true, data: [...] }
  const trips = tripsData?.data || [];

  if (truckLoading || tripsLoading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error loading trips: {error.message}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Truck Trip History</h1>
          {truck && (
            <p className="text-gray-600">
              {truck.licensePlate} – {truck.brand} {truck.model}
            </p>
          )}
        </div>
      </div>
      <TripHistoryMap trips={trips} title="Completed Trips" />
    </div>
  );
};

export default TruckHistory;