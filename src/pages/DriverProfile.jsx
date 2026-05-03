// frontend/src/pages/DriverProfile.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { tripHistoryService } from '../services/tripHistoryService';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  CalendarIcon, 
  ChartBarIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const DriverProfile = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Fetch driver details
  const { data: driverData, isLoading: driverLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverService.getById(driverId),
    enabled: !!driverId,
  });

  // Fetch driver trips
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['driver-trips', driverId],
    queryFn: () => tripHistoryService.getDriverTrips(driverId, { limit: 50 }),
    enabled: !!driverId,
  });

  // Fetch driver stats
  const { data: statsData } = useQuery({
    queryKey: ['driver-stats', driverId],
    queryFn: () => tripHistoryService.getDriverTripStats(driverId),
    enabled: !!driverId,
  });

  // Fetch driver score logs
  const { data: scoreLogsData } = useQuery({
    queryKey: ['driver-score-logs', driverId],
    queryFn: () => driverService.getScoreLogs(driverId, 20),
    enabled: !!driverId,
  });

  const driver = driverData?.data;
  const trips = tripsData?.data || [];
  const stats = statsData?.data || {};
  const scoreLogs = scoreLogsData?.data || [];

  // Calculate statistics safely
  const totalTrips = stats.totalTrips || trips.length || 0;
  const completedTrips = stats.completedTrips || trips.filter(t => t.status === 'completed').length || 0;
  const totalDistance = stats.totalDistance || trips.reduce((sum, trip) => sum + (trip.actualDistanceKm || trip.totalDistance || 0), 0) || 0;
  const totalDuration = stats.totalDuration || trips.reduce((sum, trip) => sum + (trip.actualDurationHours || trip.totalDuration || 0), 0) || 0;

  // Safe average speed calculation
  let avgSpeed = 0;
  if (totalDistance > 0 && totalDuration > 0) {
    avgSpeed = (totalDistance / totalDuration * 60).toFixed(1);
  } else if (stats.averageSpeed) {
    avgSpeed = stats.averageSpeed;
  }

  const maxSpeed = stats.maxSpeed || Math.max(...trips.map(t => t.maxSpeed || 0), 0) || 0;
  const speedViolations = stats.speedViolations || trips.reduce((sum, trip) => sum + (trip.speedViolations || 0), 0) || 0;

  // Safe On-Time Delivery Rate calculation
  let onTimeDeliveryRate = 0;
  if (completedTrips > 0) {
    const onTimeTrips = trips.filter(t => t.status === 'completed' && !t.isLate).length;
    onTimeDeliveryRate = ((onTimeTrips / completedTrips) * 100).toFixed(1);
  } else if (stats.onTimeDeliveryRate) {
    onTimeDeliveryRate = stats.onTimeDeliveryRate;
  } else {
    onTimeDeliveryRate = 0;
  }

  // Helper function to get readable location
  const getLocationDisplay = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (location.address) return location.address;
    if (location.name) return location.name;
    if (location.city) return `${location.city}, ${location.country || ''}`;
    return 'N/A';
  };

  if (driverLoading || tripsLoading) return <LoadingSpinner />;
  if (!driver) return <div className="p-6 text-red-600">Driver not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Driver Profile</h1>
              <p className="text-gray-500 text-sm mt-1">Detailed performance and history</p>
            </div>
          </div>
          <Link
            to="/dashboard/drivers"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Drivers
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Driver Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  {driver.photo?.url ? (
                    <img src={driver.photo.url} alt={driver.name} className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="h-12 w-12 text-white" />
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{driver.name}</h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      driver.status === 'available' ? 'bg-green-100 text-green-800' :
                      driver.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {driver.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      Score: {driver.score || 0} pts
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="text-left md:text-right">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <PhoneIcon className="h-4 w-4" />
                  <span>{driver.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{driver.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <IdentificationIcon className="h-4 w-4" />
                  <span>License: {driver.licenseNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Truck */}
          {driver.assignedTruck && (
            <div className="p-6 bg-blue-50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Currently Assigned Truck</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {driver.assignedTruck.licensePlate} – {driver.assignedTruck.brand} {driver.assignedTruck.model}
                    </p>
                  </div>
                </div>
                <Link 
                  to={`/dashboard/trucks/${driver.assignedTruck._id}`}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  View Truck
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <StatCard title="Total Trips" value={totalTrips} color="blue" />
          <StatCard title="Completed" value={completedTrips} color="green" />
          <StatCard title="Total Distance" value={`${totalDistance.toFixed(1)} km`} color="orange" />
          <StatCard title="Avg Speed" value={`${avgSpeed} km/h`} color="purple" />
          <StatCard title="Violations" value={speedViolations} color="red" />
          <StatCard title="On-Time Rate" value={`${onTimeDeliveryRate}%`} color="yellow" />
        </div>

        {/* Score History */}
        {scoreLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                Score History
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {scoreLogs.map((log, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm text-gray-600">{log.reason || 'Score adjustment'}</p>
                    <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`font-semibold ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {log.points > 0 ? `+${log.points}` : log.points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trips History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Trip History ({totalTrips} trips)
            </h2>
          </div>

          {trips.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <TruckIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>No trips found for this driver</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {trips.map((trip) => (
                <TripItem 
                  key={trip._id} 
                  trip={trip} 
                  isSelected={selectedTrip?._id === trip._id}
                  onToggle={() => setSelectedTrip(selectedTrip?._id === trip._id ? null : trip)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTS ====================

const StatCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };
  
  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} rounded-lg shadow-sm p-4 text-white`}>
      <p className="text-xs opacity-90">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

const TripItem = ({ trip, isSelected, onToggle }) => {
  const getStatusClass = () => {
    if (trip.status === 'completed') return 'bg-green-100 text-green-800';
    if (trip.status === 'in_progress') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'completed': 'Completed',
      'in_progress': 'In Progress',
      'planned': 'Planned',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  // Helper function to get readable location
  const getLocationDisplay = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (location.address) return location.address;
    if (location.name) return location.name;
    if (location.city) return `${location.city}, ${location.country || ''}`;
    return 'N/A';
  };

  const originDisplay = getLocationDisplay(trip.origin);
  const destinationDisplay = getLocationDisplay(trip.destination);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-medium text-gray-900">
              Trip #{trip.tripNumber || trip._id?.slice(-6) || 'N/A'}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass()}`}>
              {getStatusText(trip.status)}
            </span>
            {trip.isLate && (
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                Late Delivery
              </span>
            )}
            {(trip.speedViolations > 0 || trip.hasSpeedViolation) && (
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Speed Violations
              </span>
            )}
          </div>
          <button className="text-blue-600 hover:text-blue-800">
            {isSelected ? '▼' : '▶'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            <span>{trip.startTime ? new Date(trip.startTime).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <TruckIcon className="h-4 w-4" />
            <span>{trip.truck?.licensePlate || trip.truck?.displayPlate || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span>{trip.actualDistanceKm || trip.totalDistance || 0} km</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ChartBarIcon className="h-4 w-4" />
            <span>Max: {trip.maxSpeed || 0} km/h</span>
          </div>
        </div>

        {/* Origin & Destination Summary */}
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="font-medium">📍 From:</span>
            <span className="truncate max-w-[200px]">{originDisplay}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">➡️ To:</span>
            <span className="truncate max-w-[200px]">{destinationDisplay}</span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Route Details</p>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">From:</span> {originDisplay}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">To:</span> {destinationDisplay}
                </p>
                {trip.originCoordinates?.coordinates && (
                  <p className="text-xs text-gray-400">
                    📍 Origin: {trip.originCoordinates.coordinates[1]?.toFixed(6)}, {trip.originCoordinates.coordinates[0]?.toFixed(6)}
                  </p>
                )}
                {trip.destinationCoordinates?.coordinates && (
                  <p className="text-xs text-gray-400">
                    📍 Destination: {trip.destinationCoordinates.coordinates[1]?.toFixed(6)}, {trip.destinationCoordinates.coordinates[0]?.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Performance Metrics</p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Duration: {trip.actualDurationHours || trip.totalDuration || 0} min</p>
                <p>Avg Speed: {trip.averageSpeed?.toFixed(1) || 0} km/h</p>
                <p>Distance: {trip.actualDistanceKm || trip.totalDistance || 0} km</p>
                {trip.fuelConsumption && <p>Fuel: {trip.fuelConsumption} L</p>}
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Timeline</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <span className="font-medium">Started:</span>{' '}
                {trip.actualStartTime ? new Date(trip.actualStartTime).toLocaleString() : 
                 trip.startTime ? new Date(trip.startTime).toLocaleString() : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Completed:</span>{' '}
                {trip.endTime ? new Date(trip.endTime).toLocaleString() : 'In Progress'}
              </div>
            </div>
          </div>
          
          {/* Speed violation details */}
          {(trip.speedViolations > 0 || trip.hasSpeedViolation) && (
            <div className="mt-4 p-3 rounded-lg bg-red-50">
              <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Speed Violation Summary
              </p>
              <p className="text-sm text-red-600 mt-1">
                {trip.speedViolations || 0} violations detected
                {trip.maxSpeedViolation && ` (Max: ${trip.maxSpeedViolation} km/h)`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverProfile;