// frontend/src/pages/TruckHistory.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tripHistoryService } from '../services/tripHistoryService';
import { truckService } from '../services/truckService';
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
  CpuChipIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// ============================================
// HELPER FUNCTIONS
// ============================================
const useReverseGeocode = (lat, lng) => {
const [locationName, setLocationName] = useState('Loading...');

  React.useEffect(() => {
    if (!lat || !lng) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => {
        const { city, town, village, suburb, county, country } = data.address || {};
        const name = city || town || village || suburb || county || country || 'Unknown';
        setLocationName(name);
      })
      .catch(() => setLocationName('Unknown'));
  }, [lat, lng]);

  return locationName;
};
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

// ============================================
// DATE RANGE FILTER – teal button
// ============================================
const DateRangeFilter = ({ onApply, onClear }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(new Date(startDate), new Date(endDate));
    } else {
      onApply(null, null);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onClear();
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-sm border rounded-md focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <button
          onClick={handleApply}
          className="px-3 py-1 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1 text-sm text-rose-600 hover:text-rose-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

// ============================================
// STAT CARD – fully neutral, no coloured backgrounds
// ============================================
const StatCard = ({ title, value, icon: Icon, subtitle }) => {
  return (
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
};

// ============================================
// INFO CARD – neutral background
// ============================================
const InfoCard = ({ icon: Icon, title, children }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-gray-100">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
};

// ============================================
// DEVICE CARD – teal for battery good, otherwise neutral
// ============================================
const DeviceCard = ({ device }) => {
  const getBatteryColor = (level) => {
    if (level >= 70) return 'text-teal-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-rose-600';
  };

  const statusBadge = getStatusBadge(device.status, 'device', 'sm');

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
            <p className="font-semibold text-gray-900">{device.deviceId}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Type:</span> {device.type || 'GPS Tracker'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Firmware:</span> {device.firmwareVersion || 'N/A'}
            </p>
            {device.lastSeen && (
              <p className="text-gray-500 text-xs">
                Last seen: {formatDateTime(device.lastSeen)}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-1 rounded-full ${statusBadge}`}>
            {getStatusText(device.status)}
          </span>
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-sm font-medium ${getBatteryColor(device.batteryLevel)}`}>
              {device.batteryLevel || 0}% battery
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DRIVER HISTORY CARD – teal for view link
// ============================================
const DriverHistoryCard = ({ record, basePath }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="bg-gray-100 p-3 rounded-full">
          <UserIcon className="h-6 w-6 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">
                {record.driver?.name || 'Unknown Driver'}
              </p>
              <p className="text-sm text-gray-500">
                License: {record.driver?.licenseNumber || 'N/A'}
              </p>
            </div>
            {record.driver?._id ? (
              <Link
                to={`${basePath}/drivers/${record.driver._id}`}
                className="text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                View Profile →
              </Link>
            ) : (
              <span className="text-xs text-gray-400">No profile</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Total Trips</p>
              <p className="text-lg font-bold text-gray-900">{record.totalTrips || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">First Assigned</p>
              <p className="text-sm font-medium text-gray-700">
                {formatDate(record.firstAssigned)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Assigned</p>
              <p className="text-sm font-medium text-gray-700">
                {formatDate(record.lastAssigned)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SHIPMENT CARD – neutral, uses status badges
// ============================================
const ShipmentCard = ({ trip }) => {
  const statusBadge = getStatusBadge(trip.status, 'shipment', 'sm');

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">
            {trip.tripNumber || `Trip ${trip._id?.slice(-8)}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {trip.origin} → {trip.destination}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${statusBadge}`}>
          {getStatusText(trip.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{formatDate(trip.startTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {(trip.actualDistanceKm || 0).toFixed(0)} km
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {formatDuration(trip.actualDurationHours)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Max: {trip.maxSpeed || 0} km/h</span>
        </div>
      </div>

      {trip.driver && (
        <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-100">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            Driver: <span className="font-medium text-gray-800">{trip.driver.name}</span>
          </span>
        </div>
      )}

      {trip.speedViolations > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-rose-600">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>{trip.speedViolations} speed violations</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const TruckHistory = () => {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const basePath = user?.role === 'admin' ? '/dashboard' : '/shipment_manager';

  const [activeTab, setActiveTab] = useState('shipments');
  const [showFullDrivers, setShowFullDrivers] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null, active: false });

  // Fetch truck details
  const { data: truckData, isLoading: truckLoading } = useQuery({
    queryKey: ['truck', truckId],
    queryFn: () => truckService.getById(truckId),
    enabled: !!truckId,
  });

  // Fetch trips/shipments with date filter
  const { data: tripsData, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ['trips', 'truck', truckId, dateFilter],
    queryFn: () => {
      if (dateFilter.active && dateFilter.start && dateFilter.end) {
        return tripHistoryService.getTruckTrips(truckId, {
          limit: 100,
          startDate: dateFilter.start,
          endDate: dateFilter.end,
        });
      }
      return tripHistoryService.getTruckTrips(truckId, { limit: 100 });
    },
    enabled: !!truckId,
  });

  // Fetch driver assignment history
  const { data: driverHistoryData, isLoading: driverHistoryLoading } = useQuery({
    queryKey: ['truck-driver-history', truckId, dateFilter],
    queryFn: () => truckService.getDriverAssignmentHistory(truckId),
    enabled: !!truckId,
  });

  const truck = truckData?.data;
  const trips = tripsData?.data || [];
  const driverHistory = driverHistoryData?.data?.driverHistory || [];
  const currentDriver = driverHistoryData?.data?.currentDriver;
  const locationName = useReverseGeocode(
    truckData?.data?.currentLocation?.lat,
    truckData?.data?.currentLocation?.lng
  );
  // Filter trips by date range if active
  const filteredTrips =
    dateFilter.active && dateFilter.start && dateFilter.end
      ? trips.filter((trip) => {
          const tripDate = new Date(trip.startTime || trip.createdAt);
          return tripDate >= dateFilter.start && tripDate <= dateFilter.end;
        })
      : trips;

  // Calculate statistics
  const totalTrips = filteredTrips.length;
  const completedTrips = filteredTrips.filter((t) => t.status === 'completed').length;
  const totalDistance = filteredTrips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
  const speedViolations = filteredTrips.reduce((sum, t) => sum + (t.speedViolations || 0), 0);
  const avgDistancePerTrip = totalTrips > 0 ? (totalDistance / totalTrips).toFixed(0) : 0;
  const completionRate =
    totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(0) : 0;
  const totalDeliveries = filteredTrips.filter((t) => t.status === 'completed').length;
  const activeDevices = truck?.devices?.filter((d) => d.status === 'active').length || 0;

  const recentDrivers = driverHistory.slice(0, 4);

  const handleDateFilterApply = (start, end) => {
    if (start && end) {
      setDateFilter({
        start,
        end,
        active: true,
      });
    } else {
      setDateFilter({ start: null, end: null, active: false });
    }
  };

  const handleDateFilterClear = () => {
    setDateFilter({ start: null, end: null, active: false });
  };

  if (truckLoading || tripsLoading || driverHistoryLoading) return <LoadingSpinner />;
  if (tripsError)
    return (
      <div className="p-6 text-center text-rose-600">
        Error loading data: {tripsError.message}
      </div>
    );
  if (!truck) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="pt-16">
        {/* Inline header bar – only for admin */}
        {isAdmin && (
          <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4">
              <button
                onClick={() => navigate('/dashboard/trucks')}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to Trucks</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-6 max-w-7xl mx-auto">
          {/* Truck info header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <TruckIcon className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{truck.licensePlate}</h1>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(truck.status, 'truck', 'sm')}`}>
                      {getStatusText(truck.status)}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">
                    {truck.brand} {truck.model} {truck.year ? `(${truck.year})` : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {truck.capacity && (
                  <div>
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="font-semibold text-gray-800">{truck.capacity} tons</p>
                  </div>
                )}
                {truck.type && (
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-semibold text-gray-800 capitalize">{truck.type}</p>
                  </div>
                )}
                {truck.currentLocation?.lat && truck.currentLocation?.lng && (
                  <div>
                    <p className="text-xs text-gray-500">Current Location</p>
                    <p className="font-semibold text-gray-800 truncate max-w-[150px]" title={locationName}>
                      <span>{locationName}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {truck.currentLocation.lat.toFixed(4)}, {truck.currentLocation.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter
            onApply={handleDateFilterApply}
            onClear={handleDateFilterClear}
          />

          {dateFilter.active && (
            <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-teal-50 text-teal-800 border border-teal-200">
              Showing data from {formatDate(dateFilter.start)} to {formatDate(dateFilter.end)}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Shipments"
              value={totalTrips}
              icon={ClipboardDocumentListIcon}
              subtitle={`${completedTrips} completed`}
            />
            <StatCard
              title="Deliveries"
              value={totalDeliveries}
              icon={CheckCircleIcon}
              subtitle={`${completionRate}% success rate`}
            />
            <StatCard
              title="Distance"
              value={`${totalDistance.toFixed(0)} km`}
              icon={MapPinIcon}
              subtitle={`Ø ${avgDistancePerTrip} km/trip`}
            />
            <StatCard
              title="Speed Violations"
              value={speedViolations}
              icon={ExclamationTriangleIcon}
            />
          </div>

          {/* Second Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Total Drivers Assigned"
              value={driverHistory.length}
              icon={UserGroupIcon}
            />
            <StatCard
              title="Devices Installed"
              value={truck?.devices?.length || 0}
              icon={CpuChipIcon}
              subtitle={`${activeDevices} active`}
            />
            <StatCard
              title="Truck Status"
              value={truck?.status?.toUpperCase() || 'N/A'}
              icon={TruckIcon}
            />
          </div>

          {/* Current Status Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-gray-600" />
              Current Status Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard icon={UserIcon} title="Current Driver">
                {currentDriver ? (
                  <>
                    <p className="text-xl font-bold text-gray-900">{currentDriver.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      License: {currentDriver.licenseNumber || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">Phone: {currentDriver.phone || 'N/A'}</p>
                    <p className="text-sm mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(currentDriver.status, 'driver', 'sm')}`}>
                        {getStatusText(currentDriver.status)}
                      </span>
                    </p>
                    <Link
                      to={`${basePath}/drivers/${currentDriver._id}`}
                      className="text-sm font-medium mt-3 inline-block text-teal-600 hover:text-teal-700"
                    >
                      View Full Profile →
                    </Link>
                  </>
                ) : (
                  <p className="text-gray-500">No driver currently assigned</p>
                )}
              </InfoCard>

              <InfoCard icon={CpuChipIcon} title="Device Summary">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {truck?.devices?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    IoT devices installed on this truck
                  </p>
                  {truck?.devices?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                        {activeDevices} Active
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {truck.devices.length - activeDevices} Inactive
                      </span>
                    </div>
                  )}
                </div>
              </InfoCard>
            </div>
          </div>

          {/* Tabs Navigation – teal active indicator */}
          <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('shipments')}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'shipments'
                    ? 'border-b-2 text-teal-600 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  Shipments & Deliveries ({totalTrips})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'drivers'
                    ? 'border-b-2 text-teal-600 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4" />
                  Drivers ({driverHistory.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('devices')}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'devices'
                    ? 'border-b-2 text-teal-600 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CpuChipIcon className="h-4 w-4" />
                  Devices ({truck?.devices?.length || 0})
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-200 p-6">
            {/* SHIPMENTS TAB */}
            {activeTab === 'shipments' && (
              <div>
                {filteredTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-full p-6 inline-block mb-4">
                      <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-500">No shipments found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {dateFilter.active
                        ? `No shipments in the selected date range`
                        : `This truck hasn't completed any shipments yet`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTrips.map((trip) => (
                      <ShipmentCard key={trip._id} trip={trip} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DRIVERS TAB */}
            {activeTab === 'drivers' && (
              <div>
                {driverHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-full p-6 inline-block mb-4">
                      <UserGroupIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-500">No drivers assigned</p>
                    <p className="text-sm text-gray-400 mt-1">
                      This truck has never been assigned to any driver
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {(showFullDrivers ? driverHistory : recentDrivers).map(
                        (record, idx) => (
                          <DriverHistoryCard
                            key={idx}
                            record={record}
                            basePath={basePath}
                          />
                        )
                      )}
                    </div>
                    {driverHistory.length > 4 && (
                      <div className="text-center mt-6">
                        <button
                          onClick={() => setShowFullDrivers(!showFullDrivers)}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                          {showFullDrivers
                            ? 'Show Less'
                            : `View All ${driverHistory.length} Drivers`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* DEVICES TAB */}
            {activeTab === 'devices' && (
              <div>
                {!truck?.devices?.length ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-full p-6 inline-block mb-4">
                      <CpuChipIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-500">No devices assigned</p>
                    <p className="text-sm text-gray-400 mt-1">
                      No IoT devices are currently installed on this truck
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {truck.devices.map((device) => (
                      <DeviceCard key={device._id} device={device} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckHistory;