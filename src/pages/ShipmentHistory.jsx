// frontend/src/pages/ShipmentHistory.jsx
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';                   
import { shipmentService } from '../services/shipmentService';
import { 
  ArrowLeftIcon, 
  TruckIcon, 
  UserIcon, 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  ScaleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
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

const getStatusClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    assigned: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'completed': return <CheckCircleIcon className="h-5 w-5" />;
    case 'in_progress': return <PlayCircleIcon className="h-5 w-5" />;
    case 'pending': return <ClockIcon className="h-5 w-5" />;
    case 'cancelled': return <XCircleIcon className="h-5 w-5" />;
    default: return <ClipboardDocumentListIcon className="h-5 w-5" />;
  }
};

const getStatusText = (status) => {
  const map = {
    completed: 'Completed',
    in_progress: 'In Progress',
    pending: 'Pending',
    cancelled: 'Cancelled',
    assigned: 'Assigned'
  };
  return map[status] || status;
};

// ============================================
// SUB COMPONENTS
// ============================================
const InfoRow = ({ label, value, icon: Icon, color = 'gray' }) => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 p-1.5 rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value || 'N/A'}</p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorStyles = {
    blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500',
    purple: 'bg-purple-500', red: 'bg-red-500', teal: 'bg-teal-500',
    indigo: 'bg-indigo-500', cyan: 'bg-cyan-500', gray: 'bg-gray-500'
  };
  
  return (
    <div className={`rounded-2xl p-5 text-white shadow-md ${colorStyles[color] || 'bg-gray-500'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="bg-white/20 rounded-xl p-2">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

const Timeline = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No timeline events available</p>
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch(type) {
      case 'created': return <FlagIcon className="h-4 w-4 text-blue-500" />;
      case 'assigned': return <UserIcon className="h-4 w-4 text-purple-500" />;
      case 'started': return <PlayCircleIcon className="h-4 w-4 text-green-500" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== events.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div className="flex items-center justify-center">
                  <div className="bg-gray-100 rounded-full p-1.5">
                    {getEventIcon(event.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">{event.title}</span>
                    {event.description && <span className="text-gray-500"> - {event.description}</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {formatDateTime(event.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ShipmentHistory = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();                    // ← Now properly used

  // Determine correct base path for Admin vs Shipment Manager
  const basePath = user?.role === 'admin' ? '/dashboard' : '/shipment_manager';

  // Fetch shipment details
  const { data: shipmentData, isLoading: shipmentLoading, error: shipmentError } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => shipmentService.getById(shipmentId),
    enabled: !!shipmentId,
  });

  const shipment = shipmentData?.data;

  if (shipmentLoading) return <LoadingSpinner />;
  
  if (shipmentError) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Shipment</h3>
          <p className="text-red-600">{shipmentError.message}</p>
          <button 
            onClick={() => navigate(`${basePath}/shipments`)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 rounded-xl p-6 max-w-md mx-auto">
          <TruckIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Shipment Not Found</h3>
          <p className="text-yellow-600">The shipment you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate(`${basePath}/shipments`)}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  const driver = shipment.driver;
  const truck = shipment.truck;
  
  const onTimeStatus = shipment.actualDeliveryDate && shipment.plannedDeliveryDate
    ? new Date(shipment.actualDeliveryDate) <= new Date(shipment.plannedDeliveryDate)
    : null;

  const timelineEvents = [
    shipment.createdAt && { type: 'created', title: 'Shipment Created', timestamp: shipment.createdAt },
    shipment.assignedAt && { type: 'assigned', title: 'Driver Assigned', description: driver?.name ? `Assigned to ${driver.name}` : 'Assigned', timestamp: shipment.assignedAt },
    shipment.actualDepartureDate && { type: 'started', title: 'Trip Started', timestamp: shipment.actualDepartureDate },
    shipment.actualDeliveryDate && { type: 'completed', title: 'Trip Completed', timestamp: shipment.actualDeliveryDate },
    shipment.status === 'cancelled' && shipment.cancelledAt && { type: 'cancelled', title: 'Shipment Cancelled', timestamp: shipment.cancelledAt }
  ].filter(Boolean);

  const getCargoTypeDisplay = () => shipment.cargoType || shipment.shipmentType || 'Standard';
  const getDescriptionDisplay = () => shipment.description || shipment.goods || 'No description';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shipment Details</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {shipment.shipmentId || (shipment._id ? shipment._id.slice(-8) : 'Unknown')}
              </p>
            </div>
          </div>

          <Link 
            to={`${basePath}/shipments`} 
            className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Shipments
          </Link>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Status Banner */}
        <div className={`mb-6 rounded-xl border p-4 ${getStatusClass(shipment.status)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(shipment.status)}
            <div>
              <p className="font-semibold text-lg">Status: {getStatusText(shipment.status)}</p>
              {onTimeStatus !== null && (
                <p className="text-sm mt-0.5">
                  {onTimeStatus ? '✅ Delivered on time' : '⚠️ Delivered late'}
                </p>
              )}
            </div>
          </div>
        </div>

       {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Loading Zone"
          value={shipment.loadingZone?.name || 'N/A'}
          icon={MapPinIcon}
          color="blue"
        />
        <StatCard
          title="Weight"
          value={shipment.weightKg ? `${shipment.weightKg} kg` : 'N/A'}
          icon={ScaleIcon}
          color="green"
        />
        <StatCard
          title="Status"
          value={getStatusText(shipment.status)}
          icon={CheckCircleIcon}
          color={shipment.status === 'completed' ? 'green' : 'orange'}
        />
        <StatCard
          title="Priority"
          value={shipment.isPriority ? 'High' : 'Normal'}
          icon={ExclamationTriangleIcon}
          color={shipment.isPriority ? 'red' : 'gray'}
        />
      </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Shipment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-purple-600" />
                Route Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <FlagIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Origin</p>
                    <p className="font-medium text-gray-900">{shipment.origin || 'N/A'}</p>
                    {shipment.originCoordinates && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {shipment.originCoordinates.lat}, {shipment.originCoordinates.lng}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <FlagIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Destination</p>
                    <p className="font-medium text-gray-900">{shipment.destination || 'N/A'}</p>
                    {shipment.destinationCoordinates && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📍 {shipment.destinationCoordinates.lat}, {shipment.destinationCoordinates.lng}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CubeIcon className="h-5 w-5 text-purple-600" />
                Cargo Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Cargo Type" value={getCargoTypeDisplay()} icon={CubeIcon} color="purple" />
                <InfoRow label="Weight" value={shipment.weightKg ? `${shipment.weightKg} kg` : 'N/A'} icon={ScaleIcon} color="blue" />
                <InfoRow label="Goods" value={shipment.goods || 'N/A'} icon={ClipboardDocumentListIcon} color="orange" />
                <div className="md:col-span-2">
                  <InfoRow label="Description" value={getDescriptionDisplay()} icon={DocumentTextIcon} color="gray" />
                </div>
              </div>
            </div>

            {/* Timeline */}
            {timelineEvents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-purple-600" />
                  Shipment Timeline
                </h2>
                <Timeline events={timelineEvents} />
              </div>
            )}
          </div>

          {/* Right Column - Driver & Truck Info */}
          <div className="space-y-6">
            {/* Driver Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-green-600" />
                Driver Information
              </h2>
              {driver ? (
                <div className="space-y-3">
                  <InfoRow label="Driver Name" value={driver.name} icon={UserIcon} color="green" />
                  <InfoRow label="License Number" value={driver.licenseNumber || 'N/A'} icon={IdentificationIcon} color="blue" />
                  <InfoRow label="Phone" value={driver.phone || 'N/A'} icon={PhoneIcon} color="purple" />
                  <InfoRow label="Email" value={driver.email || 'N/A'} icon={EnvelopeIcon} color="indigo" />
                  {driver.rating && (
                    <InfoRow label="Rating" value={`${driver.rating} / 5`} icon={ChartBarIcon} color="yellow" />
                  )}
                  <Link 
                    to={`${basePath}/drivers/${driver._id}`}           // ← Fixed
                    className="mt-3 inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    View Driver Profile →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No driver assigned to this shipment</p>
                </div>
              )}
            </div>

            {/* Truck Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-pink-600" />
                Truck Information
              </h2>
              {truck ? (
                <div className="space-y-3">
                  <InfoRow label="License Plate" value={truck.licensePlate || 'N/A'} icon={TruckIcon} color="pink" />
                  <InfoRow label="Brand & Model" value={`${truck.brand || ''} ${truck.model || ''}`.trim() || 'N/A'} icon={TruckIcon} color="blue" />
                  <InfoRow label="Year" value={truck.year || 'N/A'} icon={CalendarIcon} color="purple" />
                  <InfoRow label="Capacity" value={truck.capacity ? `${truck.capacity} tons` : 'N/A'} icon={ChartBarIcon} color="orange" />
                  <InfoRow label="Type" value={truck.type || 'N/A'} icon={CubeIcon} color="green" />
                  <Link 
                    to={`${basePath}/truck-history/${truck._id}`}      // ← Fixed
                    className="mt-3 inline-flex items-center text-sm text-pink-600 hover:text-pink-700 font-medium"
                  >
                    View Truck History →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <TruckIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No truck assigned to this shipment</p>
                </div>
              )}
            </div>

            {/* Schedule Dates */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                Schedule Dates
              </h2>
              <div className="space-y-3">
                <InfoRow label="Planned Departure" value={formatDateTime(shipment.plannedDepartureDate)} icon={CalendarIcon} color="blue" />
                <InfoRow label="Planned Delivery" value={formatDateTime(shipment.plannedDeliveryDate)} icon={CalendarIcon} color="purple" />
                {shipment.actualDepartureDate && (
                  <InfoRow label="Actual Departure" value={formatDateTime(shipment.actualDepartureDate)} icon={PlayCircleIcon} color="green" />
                )}
                {shipment.actualDeliveryDate && (
                  <InfoRow label="Actual Delivery" value={formatDateTime(shipment.actualDeliveryDate)} icon={CheckCircleIcon} color="green" />
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                Additional Information
              </h2>
              <div className="space-y-3">
                <InfoRow label="Shipment ID" value={shipment.shipmentId || shipment._id} icon={ClipboardDocumentListIcon} color="gray" />
                <InfoRow label="Created By" value={shipment.createdBy?.name || 'N/A'} icon={UserIcon} color="gray" />
                <InfoRow label="Created At" value={formatDateTime(shipment.createdAt)} icon={CalendarIcon} color="gray" />
                {shipment.assignedTo && (
                  <InfoRow 
                    label="Assigned To" 
                    value={typeof shipment.assignedTo === 'object' ? shipment.assignedTo.name : shipment.assignedTo} 
                    icon={UserGroupIcon} 
                    color="indigo" 
                  />
                )}
                {shipment.cancellationReason && (
                  <InfoRow label="Cancellation Reason" value={shipment.cancellationReason} icon={ExclamationTriangleIcon} color="red" />
                )}
              </div>
            </div>

            {/* Notes Section */}
            {shipment.notes && shipment.notes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                  Notes ({shipment.notes.length})
                </h2>
                <div className="space-y-3">
                  {shipment.notes.map((note, index) => (
                    <div key={note._id || index} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-600">
                          {note.createdByName || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentHistory;