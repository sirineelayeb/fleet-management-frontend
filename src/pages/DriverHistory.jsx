// frontend/src/pages/DriverHistory.jsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { tripHistoryService } from '../services/tripHistoryService';
import { useAuth } from '../context/AuthContext';
import { getStatusBadge, getStatusText } from '../constants/colors';
import TripDetailsModal from '../components/Trips/TripDetailsModal';
import {
  ArrowLeftIcon,
  UserIcon,
  TruckIcon,
  PhoneIcon,
  StarIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (hours) => {
  if (!hours) return '0 min';
  const mins = Math.round(hours * 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
};
const resolvePhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const normalized = url.replace(/\\/g, '/');
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) return `${import.meta.env.VITE_API_URL}/${normalized.slice(uploadsIndex)}`;
  return url;
};


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
// INFO ROW – simple, no background
// ============================================
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-2 text-sm">
    {Icon && <Icon className="h-4 w-4 text-gray-400" />}
    <span className="text-gray-500 w-24">{label}:</span>
    <span className="font-medium text-gray-900">{value || '—'}</span>
  </div>
);

// ============================================
// TRUCK CARD – minimal, as in TruckHistory
// ============================================
const TruckCard = ({ truck, trips, basePath }) => {
  const truckTrips = trips.filter(
    (t) => t.truck?._id === truck._id || t.truck === truck._id
  );
  const totalDistance = truckTrips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
  const totalTrips = truckTrips.length;
  const violations = truckTrips.reduce((sum, t) => sum + (t.speedViolations || 0), 0);
  const avgSpeed =
    truckTrips.reduce((sum, t) => sum + (t.averageSpeed || 0), 0) / totalTrips || 0;
  const lastUsed = truckTrips[0]?.endTime || truckTrips[0]?.startTime;

  return (
    <Link
      to={`${basePath}/truck-history/${truck._id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-2 rounded-lg">
            <TruckIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{truck.licensePlate}</h4>
            <p className="text-xs text-gray-500">
              {truck.brand} {truck.model}
            </p>
          </div>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {totalTrips} trips
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Distance</p>
          <p className="font-semibold text-gray-900">{totalDistance.toFixed(0)} km</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Speed</p>
          <p className="font-semibold text-gray-900">{avgSpeed.toFixed(0)} km/h</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Violations</p>
          <p
            className={`font-semibold ${
              violations > 0 ? 'text-rose-600' : 'text-teal-600'
            }`}
          >
            {violations}
          </p>
        </div>
      </div>

      {lastUsed && (
        <p className="text-xs text-gray-400 mt-3">Last used: {formatDate(lastUsed)}</p>
      )}
    </Link>
  );
};

// ============================================
// TRIP ITEM – matches TruckHistory cards
// ============================================
const TripItem = ({ trip, onViewDetails }) => {
  const statusBadge = getStatusBadge(trip.status, 'shipment', 'sm');
  const statusText = getStatusText(trip.status);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => onViewDetails(trip)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-gray-900">
                {trip.tripNumber || trip._id?.slice(-8)}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge}`}>
                {statusText}
              </span>
              {trip.speedViolations > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  {trip.speedViolations}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span>{formatDate(trip.startTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                <span>{(trip.actualDistanceKm || 0).toFixed(0)} km</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                <span>{formatDuration(trip.actualDurationHours)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChartBarIcon className="h-3 w-3" />
                <span>{trip.maxSpeed || 0} km/h</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 truncate">
              {typeof trip.origin === 'string' ? trip.origin : 'N/A'} →{' '}
              {typeof trip.destination === 'string' ? trip.destination : 'N/A'}
            </div>
            {trip.truck && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TruckIcon className="h-3 w-3" />
                <span>{trip.truck.licensePlate || 'N/A'}</span>
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(trip);
            }}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-1"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DriverHistory = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const basePath = user?.role === 'admin' ? '/dashboard' : '/shipment_manager';

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);

  // Fetch driver details
  const { data: driverData, isLoading: driverLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverService.getById(driverId),
    enabled: !!driverId,
  });

  // Fetch driver trips
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['driver-trips', driverId],
    queryFn: () => tripHistoryService.getDriverTrips(driverId, { limit: 100 }),
    enabled: !!driverId,
  });

  const driver = driverData?.data;
  const trips = tripsData?.data || [];

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === 'completed').length;
  const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
  const speedViolations = trips.reduce((sum, t) => sum + (t.speedViolations || 0), 0);
  const avgScore = driver?.score || 0;

  // Unique trucks driven
  const trucksDriven = trips.reduce((unique, trip) => {
    const truck = trip.truck;
    if (truck && truck._id && !unique.some((t) => t._id === truck._id)) {
      unique.push(truck);
    }
    return unique;
  }, []);

  const handleViewTripDetails = (trip) => {
    setSelectedTrip(trip);
    setShowTripModal(true);
  };

  if (driverLoading || tripsLoading) return <LoadingSpinner />;

  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Driver not found</p>
          <button
            onClick={() => navigate(`${basePath}/drivers`)}
            className="mt-3 text-teal-600 hover:text-teal-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Total Trips"
              value={totalTrips}
              icon={ChartBarIcon}
              subtitle={`${completedTrips} completed`}
            />
            <StatCard
              title="Completed"
              value={completedTrips}
              icon={CalendarIcon}
              subtitle={`${totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(0) : 0}% rate`}
            />
            <StatCard
              title="Distance"
              value={`${totalDistance.toFixed(0)} km`}
              icon={MapPinIcon}
            />
            <StatCard
              title="Violations"
              value={speedViolations}
              icon={ExclamationTriangleIcon}
            />
            <StatCard title="Score" value={avgScore} icon={StarIcon} />
          </div>

          {/* Driver Info Card – white, border */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-200">
           <div className="flex items-start gap-5">
            {/* Driver photo or fallback */}
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center shadow-sm overflow-hidden">
              {driver.photo?.url ? (
                <img
                  src={resolvePhotoUrl(driver.photo.url)}
                  alt={driver.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg ...>'; /* fallback to icon */ }}
                />
              ) : (
                <UserIcon className="h-10 w-10 text-gray-600" />
              )}
            </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{driver.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  <InfoRow label="License" value={driver.licenseNumber} icon={IdentificationIcon} />
                  <InfoRow label="Phone" value={driver.phone} icon={PhoneIcon} />
                  <InfoRow label="Email" value={driver.email} icon={EnvelopeIcon} />
                  <InfoRow label="CIN" value={driver.cin} icon={IdentificationIcon} />
                  <InfoRow label="Status" value={driver.status?.toUpperCase()} icon={ClockIcon} />
                  <InfoRow
                    label="Current Truck"
                    value={driver.assignedTruck?.licensePlate || 'None'}
                    icon={TruckIcon}
                  />
                  <InfoRow label="Hire Date" value={formatDate(driver.hireDate)} icon={CalendarIcon} />
                </div>
              </div>
            </div>
          </div>

          {/* Trucks Driven Section – same style as TruckHistory */}
          {trucksDriven.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <TruckIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Trucks Driven</h3>
                    <p className="text-xs text-gray-500">All trucks operated by this driver</p>
                  </div>
                </div>
                <div className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                  {trucksDriven.length} truck{trucksDriven.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trucksDriven.map((truck) => (
                  <TruckCard
                    key={truck._id}
                    truck={truck}
                    trips={trips}
                    basePath={basePath}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trips List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
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
                <TruckIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
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
                    onViewDetails={handleViewTripDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Details Modal */}
      {showTripModal && selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          onClose={() => {
            setShowTripModal(false);
            setSelectedTrip(null);
          }}
        />
      )}
    </div>
  );
};

export default DriverHistory;