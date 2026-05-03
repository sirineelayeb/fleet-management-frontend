// frontend/src/pages/DriverHistory.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import { tripHistoryService } from '../services/tripHistoryService';
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
  EnvelopeIcon
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
    day: 'numeric' 
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

const getStatusClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status) => {
  const map = {
    completed: 'Completed',
    in_progress: 'In Progress',
    cancelled: 'Cancelled',
    pending: 'Pending'
  };
  return map[status] || status;
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
    case 'in_progress': return <PlayCircleIcon className="h-4 w-4" />;
    case 'cancelled': return <XCircleIcon className="h-4 w-4" />;
    default: return null;
  }
};

// ============================================
// STAT CARD - EXACT SAME COLORS AS TRUCKHISTORY
// ============================================
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorStyles = {
    blue: 'from-blue-400 to-blue-500',
    green: 'from-emerald-400 to-emerald-500',
    orange: 'from-orange-400 to-orange-500',
    purple: 'from-violet-400 to-violet-500',
    red: 'from-rose-400 to-rose-500',
    teal: 'from-teal-400 to-teal-500',
    indigo: 'from-indigo-400 to-indigo-500'
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorStyles[color]} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs opacity-80 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// INFO ROW
// ============================================
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-2 text-sm">
    {Icon && <Icon className="h-4 w-4 text-gray-400" />}
    <span className="text-gray-500 w-24">{label}:</span>
    <span className="font-medium text-gray-900">{value || '—'}</span>
  </div>
);

// ============================================
// TRUCK CARD - DISPLAY TRUCK STATISTICS
// ============================================
const TruckCard = ({ truck, trips, onViewTruck }) => {
  const truckTrips = trips.filter(t => t.truck?._id === truck._id || t.truck === truck._id);
  const totalDistance = truckTrips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
  const totalTrips = truckTrips.length;
  const violations = truckTrips.reduce((sum, t) => sum + (t.speedViolations || 0), 0);
  const avgSpeed = truckTrips.reduce((sum, t) => sum + (t.averageSpeed || 0), 0) / totalTrips || 0;
  const lastUsed = truckTrips[0]?.endTime || truckTrips[0]?.startTime;

  return (
    <div 
      onClick={() => onViewTruck(truck._id)}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <TruckIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{truck.licensePlate}</h4>
            <p className="text-xs text-gray-500">{truck.brand} {truck.model}</p>
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
          <p className={`font-semibold ${violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {violations}
          </p>
        </div>
      </div>
      
      {lastUsed && (
        <p className="text-xs text-gray-400 mt-3">
          Last used: {formatDate(lastUsed)}
        </p>
      )}
    </div>
  );
};

// ============================================
// TRIP ITEM - SAME AS TRUCKHISTORY
// ============================================
const TripItem = ({ trip, onViewDetails }) => {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onViewDetails(trip)}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-gray-900">
                {trip.tripNumber || trip._id?.slice(-8)}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getStatusClass(trip.status)}`}>
                {getStatusIcon(trip.status)}
                {getStatusText(trip.status)}
              </span>
              {trip.speedViolations > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
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
              {typeof trip.origin === 'string' ? trip.origin : 'N/A'} → {typeof trip.destination === 'string' ? trip.destination : 'N/A'}
            </div>
            {trip.truck && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TruckIcon className="h-3 w-3" />
                <span>{trip.truck.licensePlate || 'N/A'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onViewDetails(trip); }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STICKY HEADER
// ============================================
const StickyHeader = ({ driver, onBack }) => {
  const [isSticky, setIsSticky] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const offset = headerRef.current.getBoundingClientRect().top;
        setIsSticky(offset <= 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div 
        ref={headerRef}
        className={`bg-white border-b transition-all duration-300 z-50 ${
          isSticky ? 'fixed top-0 left-0 right-0 shadow-md' : ''
        }`}
      >
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Driver History</h1>
              {driver && (
                <p className="text-sm text-gray-500">{driver.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {isSticky && <div className="h-[57px]" />}
    </>
  );
};

// ============================================
// CUSTOM ICON COMPONENTS
// ============================================
const PlayCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================
// MAIN COMPONENT
// ============================================
const DriverHistory = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);

  const { data: driverData, isLoading: driverLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverService.getById(driverId),
    enabled: !!driverId,
  });

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['driver-trips', driverId],
    queryFn: () => tripHistoryService.getDriverTrips(driverId, { limit: 100 }),
    enabled: !!driverId,
  });

  const driver = driverData?.data;
  const trips = tripsData?.data || [];

  // Calculate statistics
  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
  const speedViolations = trips.reduce((sum, t) => sum + (t.speedViolations || 0), 0);
  const avgScore = driver?.score || 0;

  // Get unique trucks driven by this driver
  const trucksDriven = trips.reduce((unique, trip) => {
    const truck = trip.truck;
    if (truck && truck._id && !unique.some(t => t._id === truck._id)) {
      unique.push(truck);
    }
    return unique;
  }, []);

  const handleBack = () => navigate('/dashboard/drivers');
  
  const handleViewTripDetails = (trip) => {
    setSelectedTrip(trip);
    setShowTripModal(true);
  };

  const handleViewTruckHistory = (truckId) => {
    navigate(`/dashboard/truck-history/${truckId}`);
  };

  if (driverLoading || tripsLoading) return <LoadingSpinner />;

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Driver not found</p>
          <button onClick={handleBack} className="mt-3 text-blue-600">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <StickyHeader driver={driver} onBack={handleBack} />

        <div className="p-6 max-w-7xl mx-auto">
          {/* Stats Row - EXACT SAME COLORS AS TRUCKHISTORY */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard 
              title="Total Trips" 
              value={totalTrips} 
              icon={ChartBarIcon}
              color="blue" 
            />
            <StatCard 
              title="Completed" 
              value={completedTrips} 
              icon={CalendarIcon}
              color="green" 
            />
            <StatCard 
              title="Distance" 
              value={`${totalDistance.toFixed(0)} km`} 
              icon={MapPinIcon}
              color="teal" 
            />
            <StatCard 
              title="Violations" 
              value={speedViolations} 
              icon={ExclamationTriangleIcon}
              color="red" 
            />
            <StatCard 
              title="Score" 
              value={avgScore} 
              icon={StarIcon}
              color="purple" 
            />
          </div>

          {/* Driver Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-md">
                <UserIcon className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{driver.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  <InfoRow label="License" value={driver.licenseNumber} icon={IdentificationIcon} />
                  <InfoRow label="Phone" value={driver.phone} icon={PhoneIcon} />
                  <InfoRow label="Email" value={driver.email} icon={EnvelopeIcon} />
                  <InfoRow label="CIN" value={driver.cin} icon={IdentificationIcon} />
                  <InfoRow label="Status" value={driver.status?.toUpperCase()} icon={ClockIcon} />
                  <InfoRow label="Current Truck" value={driver.assignedTruck?.licensePlate || 'None'} icon={TruckIcon} />
                  <InfoRow label="Hire Date" value={formatDate(driver.hireDate)} icon={CalendarIcon} />
                </div>
              </div>
            </div>
          </div>

          {/* Trucks Driven Section */}
          {trucksDriven.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <TruckIcon className="h-5 w-5 text-blue-600" />
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
                    onViewTruck={handleViewTruckHistory}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trips List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Trip History</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Complete record of all trips</p>
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-semibold text-gray-700">{totalTrips} total trips</span>
                </div>
              </div>
            </div>
            {trips.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <TruckIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-400">No trips found</p>
                <p className="text-sm text-gray-400 mt-1">This driver hasn't completed any trips yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {trips.map((trip) => (
                  <TripItem key={trip._id} trip={trip} onViewDetails={handleViewTripDetails} />
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
    </>
  );
};

export default DriverHistory;