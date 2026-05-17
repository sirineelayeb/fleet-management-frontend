// frontend/src/pages/DriverProfile.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { tripHistoryService } from '../services/tripHistoryService';
import { useAuth } from '../context/AuthContext';
import { getStatusBadge, getStatusText } from '../constants/colors';
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

// ============================================
// STAT CARD – neutral white, same as TruckHistory
// ============================================
const StatCard = ({ title, value, icon: Icon, subtitle }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className="bg-gray-100 rounded-xl p-2">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      )}
    </div>
  </div>
);

// ============================================
// TRIP ITEM – matches TruckHistory style
// ============================================
const TripItem = ({ trip, isSelected, onToggle, basePath }) => {
  const statusBadge = getStatusBadge(trip.status, 'shipment', 'sm');
  const statusText = getStatusText(trip.status);

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
    <div className="border-b border-gray-100 last:border-0">
      <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-medium text-gray-900">
              Trip #{trip.tripNumber || trip._id?.slice(-6) || 'N/A'}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${statusBadge}`}>
              {statusText}
            </span>
            {trip.isLate && (
              <span className="px-2 py-1 text-xs rounded-full bg-rose-100 text-rose-700">
                Late Delivery
              </span>
            )}
            {(trip.speedViolations > 0 || trip.hasSpeedViolation) && (
              <span className="px-2 py-1 text-xs rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Speed Violations
              </span>
            )}
          </div>
          <button className="text-teal-600 hover:text-teal-700">
            {isSelected ? '▲' : '▼'}
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
            <span className="font-medium">From:</span>
            <span className="truncate max-w-[200px]">{originDisplay}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">To:</span>
            <span className="truncate max-w-[200px]">{destinationDisplay}</span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isSelected && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
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
                    Origin: {trip.originCoordinates.coordinates[1]?.toFixed(6)}, {trip.originCoordinates.coordinates[0]?.toFixed(6)}
                  </p>
                )}
                {trip.destinationCoordinates?.coordinates && (
                  <p className="text-xs text-gray-400">
                    Destination: {trip.destinationCoordinates.coordinates[1]?.toFixed(6)}, {trip.destinationCoordinates.coordinates[0]?.toFixed(6)}
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
            <div className="mt-4 p-3 rounded-lg bg-rose-50">
              <p className="text-sm font-medium text-rose-800 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Speed Violation Summary
              </p>
              <p className="text-sm text-rose-600 mt-1">
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

// ============================================
// MAIN COMPONENT
// ============================================
const DriverProfile = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const basePath = user?.role === 'admin' ? '/dashboard' : '/shipment_manager';

  const [selectedTrip, setSelectedTrip] = useState(null);

  // Helper to resolve photo URL
  const resolvePhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const normalized = url.replace(/\\/g, '/');
    const uploadsIndex = normalized.indexOf('uploads/');
    if (uploadsIndex !== -1) return `${import.meta.env.VITE_API_URL}/${normalized.slice(uploadsIndex)}`;
    return url;
  };

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

  const photoUrl = resolvePhotoUrl(driver?.photo?.url);
  const [imgError, setImgError] = useState(false);

  if (driverLoading || tripsLoading) return <LoadingSpinner />;
  if (!driver) return <div className="p-6 text-rose-600">Driver not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fixed back button – only for admin */}
      {isAdmin && (
        <button
          onClick={() => navigate('/dashboard/drivers')}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-100 transition-all duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Back to Drivers</span>
        </button>
      )}

      {/* Conditional padding-top: only when admin has fixed button */}
      <div className={isAdmin ? 'pt-16' : ''}>
        {/* Inline header bar – only for admin */}
        {isAdmin && (
          <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4">
              <button
                onClick={() => navigate('/dashboard/drivers')}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to Drivers</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-6 max-w-7xl mx-auto">
          {/* Stats Row – neutral StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard title="Total Trips" value={totalTrips} icon={ChartBarIcon} subtitle={`${completedTrips} completed`} />
            <StatCard title="Completed" value={completedTrips} icon={CalendarIcon} subtitle={`${totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(0) : 0}% rate`} />
            <StatCard title="Total Distance" value={`${totalDistance.toFixed(1)} km`} icon={MapPinIcon} />
            <StatCard title="Avg Speed" value={`${avgSpeed} km/h`} icon={ChartBarIcon} />
            <StatCard title="Violations" value={speedViolations} icon={ExclamationTriangleIcon} />
            <StatCard title="On-Time Rate" value={`${onTimeDeliveryRate}%`} icon={StarIcon} />
          </div>

          {/* Driver Info Card – white, border, neutral */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-start gap-5">
                {/* Avatar with photo support */}
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center shadow-sm overflow-hidden">
                  {photoUrl && !imgError ? (
                    <img
                      src={photoUrl}
                      alt={driver.name}
                      className="h-full w-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{driver.name}</h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      driver.status === 'available' ? 'bg-teal-100 text-teal-700' :
                      driver.status === 'busy' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {driver.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      Score: {driver.score || 0} pts
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="text-right">
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
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 p-2 rounded-lg">
                      <TruckIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Currently Assigned Truck</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {driver.assignedTruck.licensePlate} – {driver.assignedTruck.brand} {driver.assignedTruck.model}
                      </p>
                    </div>
                  </div>
                  <Link 
                    to={`${basePath}/truck-history/${driver.assignedTruck._id}`}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors"
                  >
                    View Truck
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Score History */}
          {scoreLogs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-yellow-500" />
                  Score History
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {scoreLogs.map((log, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm text-gray-600">{log.reason || 'Score adjustment'}</p>
                      <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                    <div className={`font-semibold ${log.points > 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                      {log.points > 0 ? `+${log.points}` : log.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trips List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Trip History</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Complete record of all trips</p>
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-semibold text-gray-700">
                    {totalTrips} total trips
                  </span>
                </div>
              </div>
            </div>

            {trips.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <TruckIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-lg font-medium text-gray-400">No trips found</p>
                <p className="text-sm text-gray-400 mt-1">
                  This driver hasn't completed any trips yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {trips.map((trip) => (
                  <TripItem 
                    key={trip._id} 
                    trip={trip} 
                    isSelected={selectedTrip?._id === trip._id}
                    onToggle={() => setSelectedTrip(selectedTrip?._id === trip._id ? null : trip)}
                    basePath={basePath}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;