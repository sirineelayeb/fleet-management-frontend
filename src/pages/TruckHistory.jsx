// frontend/src/pages/TruckHistory.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tripHistoryService } from '../services/tripHistoryService';
import { truckService } from '../services/truckService';
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
  FunnelIcon
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
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-600'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status) => {
  const map = {
    completed: 'Completed',
    in_progress: 'In Progress',
    cancelled: 'Cancelled',
    pending: 'Pending',
    active: 'Active',
    maintenance: 'Maintenance',
    inactive: 'Inactive'
  };
  return map[status] || status;
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
    case 'in_progress': return <PlayCircleIcon className="h-4 w-4" />;
    case 'cancelled': return <XCircleIcon className="h-4 w-4" />;
    case 'active': return <CheckCircleIcon className="h-4 w-4" />;
    default: return null;
  }
};

// ============================================
// DATE RANGE FILTER COMPONENT
// ============================================
const DateRangeFilter = ({ onApply, onClear }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preset, setPreset] = useState('30');

  const presets = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'All time', value: 'all' }
  ];

  const handlePresetChange = (value) => {
    setPreset(value);
    if (value !== 'all') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(value));
      onApply(start, end);
    } else {
      onApply(null, null);
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onApply(new Date(startDate), new Date(endDate));
      setPreset('custom');
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setPreset('30');
    onClear();
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by period:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.value}
              onClick={() => handlePresetChange(p.value)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                preset === p.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-sm border rounded-md"
              placeholder="Start date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-sm border rounded-md"
              placeholder="End date"
            />
            <button
              onClick={handleCustomApply}
              className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
        </div>
        
        <button
          onClick={handleClear}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

// ============================================
// STAT CARD
// ============================================
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorStyles = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-emerald-400 to-emerald-600',
    orange: 'from-orange-400 to-orange-600',
    purple: 'from-violet-400 to-violet-600',
    red: 'from-rose-400 to-rose-600',
    teal: 'from-teal-400 to-teal-600',
    indigo: 'from-indigo-400 to-indigo-600',
    cyan: 'from-cyan-400 to-cyan-600'
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorStyles[color]} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs opacity-80 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="bg-white/20 rounded-xl p-2 backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// INFO CARD
// ============================================
const InfoCard = ({ icon: Icon, title, children, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200'
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl border p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 text-${color}-500`} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
};

// ============================================
// DEVICE CARD
// ============================================
const DeviceCard = ({ device }) => {
  const getBatteryColor = (level) => {
    if (level >= 70) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <DevicePhoneMobileIcon className="h-5 w-5 text-indigo-500" />
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
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(device.status)}`}>
            {getStatusText(device.status)}
          </span>
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-sm font-medium ${getBatteryColor(device.batteryLevel)}`}>
              🔋 {device.batteryLevel || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DRIVER HISTORY CARD
// ============================================
const DriverHistoryCard = ({ record }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-3 rounded-full">
          <UserIcon className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{record.driver?.name || 'Unknown Driver'}</p>
              <p className="text-sm text-gray-500">License: {record.driver?.licenseNumber || 'N/A'}</p>
            </div>
            <Link 
              to={`/dashboard/drivers/${record.driver?._id}`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View Profile →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Total Trips</p>
              <p className="text-lg font-bold text-gray-900">{record.totalTrips || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">First Assigned</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(record.firstAssigned)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Assigned</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(record.lastAssigned)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SHIPMENT CARD (for deliveries)
// ============================================
const ShipmentCard = ({ trip }) => {
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
        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusClass(trip.status)}`}>
          {getStatusIcon(trip.status)}
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
          <span className="text-gray-600">{(trip.actualDistanceKm || 0).toFixed(0)} km</span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{formatDuration(trip.actualDurationHours)}</span>
        </div>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Max: {trip.maxSpeed || 0} km/h</span>
        </div>
      </div>

      {trip.driver && (
        <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-100">
          <UserIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Driver: <span className="font-medium text-gray-800">{trip.driver.name}</span></span>
        </div>
      )}

      {trip.speedViolations > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
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
          endDate: dateFilter.end
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

  // Filter trips by date range if active
  const filteredTrips = dateFilter.active && dateFilter.start && dateFilter.end
    ? trips.filter(trip => {
        const tripDate = new Date(trip.startTime || trip.createdAt);
        return tripDate >= dateFilter.start && tripDate <= dateFilter.end;
      })
    : trips;

  // Calculate statistics
  const totalTrips = filteredTrips.length;
  const completedTrips = filteredTrips.filter(t => t.status === 'completed').length;
  const totalDistance = filteredTrips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
  const speedViolations = filteredTrips.reduce((sum, t) => sum + (t.speedViolations || 0), 0);
  const avgDistancePerTrip = totalTrips > 0 ? (totalDistance / totalTrips).toFixed(0) : 0;
  const completionRate = totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(0) : 0;
  const totalDeliveries = filteredTrips.filter(t => t.status === 'completed').length;
  const activeDevices = truck?.devices?.filter(d => d.status === 'active').length || 0;

  const recentDrivers = driverHistory.slice(0, 4);

  const handleDateFilterApply = (start, end) => {
    if (start && end) {
      setDateFilter({
        start,
        end,
        active: true
      });
    } else {
      setDateFilter({ start: null, end: null, active: false });
    }
  };

  const handleDateFilterClear = () => {
    setDateFilter({ start: null, end: null, active: false });
  };

  if (truckLoading || tripsLoading || driverHistoryLoading) return <LoadingSpinner />;
  if (tripsError) return (
    <div className="p-6 text-center text-red-600">
      Error loading data: {tripsError.message}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Truck History
              </h1>
              {truck && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {truck.licensePlate} • {truck.brand} {truck.model} • {truck.year}
                </p>
              )}
            </div>
          </div>
          <Link to="/dashboard/trucks" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Back to Trucks
          </Link>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Date Range Filter */}
        <DateRangeFilter 
          onApply={handleDateFilterApply}
          onClear={handleDateFilterClear}
        />
        
        {dateFilter.active && (
          <div className="mb-4 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
            Showing data from {formatDate(dateFilter.start)} to {formatDate(dateFilter.end)}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Shipments" 
            value={totalTrips} 
            icon={ClipboardDocumentListIcon} 
            color="blue" 
            subtitle={`${completedTrips} completed`}
          />
          <StatCard 
            title="Deliveries" 
            value={totalDeliveries} 
            icon={CheckCircleIcon} 
            color="green" 
            subtitle={`${completionRate}% success rate`}
          />
          <StatCard 
            title="Distance" 
            value={`${totalDistance.toFixed(0)} km`} 
            icon={MapPinIcon} 
            color="teal" 
            subtitle={`Ø ${avgDistancePerTrip} km/trip`}
          />
          <StatCard 
            title="Speed Violations" 
            value={speedViolations} 
            icon={ExclamationTriangleIcon} 
            color="red" 
          />
        </div>

        {/* Second Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard 
            title="Total Drivers Assigned" 
            value={driverHistory.length} 
            icon={UserGroupIcon} 
            color="purple" 
          />
          <StatCard 
            title="Devices Installed" 
            value={truck?.devices?.length || 0} 
            icon={CpuChipIcon} 
            color="indigo" 
            subtitle={`${activeDevices} active`}
          />
          <StatCard 
            title="Truck Status" 
            value={truck?.status?.toUpperCase() || 'N/A'} 
            icon={TruckIcon} 
            color={truck?.status === 'available' ? 'green' : truck?.status === 'in_mission' ? 'blue' : 'orange'} 
          />
        </div>

        {/* Current Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-blue-600" />
            Current Status Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard icon={UserIcon} title="Current Driver" color="purple">
              {currentDriver ? (
                <>
                  <p className="text-xl font-bold text-gray-900">{currentDriver.name}</p>
                  <p className="text-sm text-gray-500 mt-1">License: {currentDriver.licenseNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Phone: {currentDriver.phone || 'N/A'}</p>
                  <p className="text-sm mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusClass(currentDriver.status)}`}>
                      {currentDriver.status?.toUpperCase()}
                    </span>
                  </p>
                  <Link 
                    to={`/dashboard/drivers/${currentDriver._id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block font-medium"
                  >
                    View Full Profile →
                  </Link>
                </>
              ) : (
                <p className="text-gray-500">No driver currently assigned</p>
              )}
            </InfoCard>

            <InfoCard icon={CpuChipIcon} title="Device Summary" color="indigo">
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{truck?.devices?.length || 0}</p>
                <p className="text-sm text-gray-500">IoT devices installed on this truck</p>
                {truck?.devices?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
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

        {/* Tabs Navigation */}
        <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'shipments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
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
                  ? 'text-blue-600 border-b-2 border-blue-600'
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
                  ? 'text-blue-600 border-b-2 border-blue-600'
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
                  <p className="text-sm text-gray-400 mt-1">This truck has never been assigned to any driver</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(showFullDrivers ? driverHistory : recentDrivers).map((record, idx) => (
                      <DriverHistoryCard key={idx} record={record} />
                    ))}
                  </div>
                  {driverHistory.length > 4 && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => setShowFullDrivers(!showFullDrivers)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showFullDrivers ? 'Show Less' : `View All ${driverHistory.length} Drivers`}
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
                  <p className="text-sm text-gray-400 mt-1">No IoT devices are currently installed on this truck</p>
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
  );
};

export default TruckHistory;