import React, { useState } from 'react';
import TripDetailsModal from './TripDetailsModal';

const TripHistoryMap = ({ trips, title }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
    setShowModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{title || 'Trips'}</h3>
        <p className="text-sm text-gray-500">Click on any trip to view full details and route map.</p>
      </div>

      <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
        {trips.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No trips found.</p>
        ) : (
          trips.map(trip => (
            <div
              key={trip._id}
              onClick={() => handleTripClick(trip)}
              className="p-4 border rounded-lg cursor-pointer transition hover:bg-gray-50 hover:shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-gray-900">{trip.tripNumber}</span>
                  <p className="text-sm text-gray-600 truncate">{trip.origin} → {trip.destination}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(trip.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>📏 {trip.actualDistanceKm?.toFixed(1) || 0} km</span>
                <span>⏱️ {trip.actualDurationHours?.toFixed(1) || 0} h</span>
                {trip.shipment?.plannedDeliveryDate && (
                  <span className={new Date(trip.endTime) <= new Date(trip.shipment.plannedDeliveryDate) ? 'text-green-600' : 'text-red-600'}>
                    {new Date(trip.endTime) <= new Date(trip.shipment.plannedDeliveryDate) ? '✓ On time' : '✗ Late'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default TripHistoryMap;