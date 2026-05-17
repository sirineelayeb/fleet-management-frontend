// frontend/src/pages/ShipmentHistory.jsx
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { shipmentService } from '../services/shipmentService';
import { getStatusBadge, getStatusText } from '../constants/colors';
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
  UserGroupIcon,
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

// ============================================
// STAT CARD – white background, neutral style
// ============================================
const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{value}</p>
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
// INFO ROW – neutral icon background
// ============================================
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100">
      <Icon className="h-4 w-4 text-gray-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value || 'N/A'}</p>
    </div>
  </div>
);

// ============================================
// TIMELINE – neutral colors
// ============================================
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
    switch (type) {
      case 'created':
        return <FlagIcon className="h-4 w-4 text-gray-600" />;
      case 'assigned':
        return <UserIcon className="h-4 w-4 text-gray-600" />;
      case 'started':
        return <PlayCircleIcon className="h-4 w-4 text-gray-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-gray-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-gray-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== events.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
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
                    {event.description && (
                      <span className="text-gray-500"> - {event.description}</span>
                    )}
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
  const { user } = useAuth();
  const basePath = user?.role === 'admin' ? '/dashboard' : '/shipment_manager';

  const {
    data: shipmentData,
    isLoading: shipmentLoading,
    error: shipmentError,
  } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => shipmentService.getById(shipmentId),
    enabled: !!shipmentId,
  });

  const shipment = shipmentData?.data;

  if (shipmentLoading) return <LoadingSpinner />;

  if (shipmentError) {
    return (
      <div className="p-6 text-center">
        <div className="bg-rose-50 rounded-xl p-6 max-w-md mx-auto border border-rose-200">
          <ExclamationTriangleIcon className="h-12 w-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-rose-800 mb-2">Error Loading Shipment</h3>
          <p className="text-rose-600">{shipmentError.message}</p>
          <button
            onClick={() => navigate(`${basePath}/shipments`)}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
        <div className="bg-amber-50 rounded-xl p-6 max-w-md mx-auto border border-amber-200">
          <TruckIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Shipment Not Found</h3>
          <p className="text-amber-600">
            The shipment you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate(`${basePath}/shipments`)}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  const driver = shipment.driver;
  const truck = shipment.truck;

  const onTimeStatus =
    shipment.actualDeliveryDate && shipment.plannedDeliveryDate
      ? new Date(shipment.actualDeliveryDate) <= new Date(shipment.plannedDeliveryDate)
      : null;

  const timelineEvents = [
    shipment.createdAt && {
      type: 'created',
      title: 'Shipment Created',
      timestamp: shipment.createdAt,
    },
    shipment.assignedAt && {
      type: 'assigned',
      title: 'Driver Assigned',
      description: driver?.name ? `Assigned to ${driver.name}` : 'Assigned',
      timestamp: shipment.assignedAt,
    },
    shipment.actualDepartureDate && {
      type: 'started',
      title: 'Trip Started',
      timestamp: shipment.actualDepartureDate,
    },
    shipment.actualDeliveryDate && {
      type: 'completed',
      title: 'Trip Completed',
      timestamp: shipment.actualDeliveryDate,
    },
    shipment.status === 'cancelled' &&
      shipment.cancelledAt && {
        type: 'cancelled',
        title: 'Shipment Cancelled',
        timestamp: shipment.cancelledAt,
      },
  ].filter(Boolean);

  const statusBadgeClass = getStatusBadge(shipment.status, 'shipment', 'md');
  const statusText = getStatusText(shipment.status);
  const cargoTypeDisplay = shipment.cargoType || shipment.shipmentType || 'Standard';
  const descriptionDisplay = shipment.description || shipment.goods || 'No description';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="pt-16">
        {/* Inline header bar (optional) */}
        <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4">
            <button
              onClick={() => navigate(`${basePath}/shipments`)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to Shipments</span>
            </button>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Status Banner */}
          <div className="mb-6 rounded-xl border p-4 bg-white border-gray-200">
            <div className="flex items-center gap-3">
              <span className={statusBadgeClass}>{statusText}</span>
              {onTimeStatus !== null && (
                <p className="text-sm text-gray-600">
                  {onTimeStatus ? 'Delivered on time' : 'Delivered late'}
                </p>
              )}
            </div>
          </div>

          {/* Stats Row – neutral cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Loading Zone"
              value={shipment.loadingZone?.name || 'N/A'}
              icon={MapPinIcon}
            />
            <StatCard
              title="Weight"
              value={shipment.weightKg ? `${shipment.weightKg} kg` : 'N/A'}
              icon={ScaleIcon}
            />
            <StatCard title="Status" value={statusText} icon={CheckCircleIcon} />
            <StatCard
              title="Priority"
              value={shipment.isPriority ? 'High' : 'Normal'}
              icon={ExclamationTriangleIcon}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Shipment Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Route Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-600" />
                  Route Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <FlagIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Origin</p>
                      <p className="font-medium text-gray-900">{shipment.origin || 'N/A'}</p>
                      {shipment.originCoordinates && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {shipment.originCoordinates.lat}, {shipment.originCoordinates.lng}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <FlagIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Destination</p>
                      <p className="font-medium text-gray-900">{shipment.destination || 'N/A'}</p>
                      {shipment.destinationCoordinates && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {shipment.destinationCoordinates.lat}, {shipment.destinationCoordinates.lng}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CubeIcon className="h-5 w-5 text-gray-600" />
                  Cargo Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Cargo Type" value={cargoTypeDisplay} icon={CubeIcon} />
                  <InfoRow
                    label="Weight"
                    value={shipment.weightKg ? `${shipment.weightKg} kg` : 'N/A'}
                    icon={ScaleIcon}
                  />
                  <InfoRow label="Goods" value={shipment.goods || 'N/A'} icon={ClipboardDocumentListIcon} />
                  <div className="md:col-span-2">
                    <InfoRow label="Description" value={descriptionDisplay} icon={DocumentTextIcon} />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {timelineEvents.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-600" />
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
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  Driver Information
                </h2>
                {driver ? (
                  <div className="space-y-3">
                    <InfoRow label="Driver Name" value={driver.name} icon={UserIcon} />
                    <InfoRow
                      label="License Number"
                      value={driver.licenseNumber || 'N/A'}
                      icon={IdentificationIcon}
                    />
                    <InfoRow label="Phone" value={driver.phone || 'N/A'} icon={PhoneIcon} />
                    <InfoRow label="Email" value={driver.email || 'N/A'} icon={EnvelopeIcon} />
                    {driver.rating && (
                      <InfoRow label="Rating" value={`${driver.rating} / 5`} icon={ChartBarIcon} />
                    )}
                    <Link
                      to={`${basePath}/drivers/${driver._id}`}
                      className="mt-3 inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium"
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
                  <TruckIcon className="h-5 w-5 text-gray-600" />
                  Truck Information
                </h2>
                {truck ? (
                  <div className="space-y-3">
                    <InfoRow label="License Plate" value={truck.licensePlate || 'N/A'} icon={TruckIcon} />
                    <InfoRow
                      label="Brand & Model"
                      value={`${truck.brand || ''} ${truck.model || ''}`.trim() || 'N/A'}
                      icon={TruckIcon}
                    />
                    <InfoRow label="Year" value={truck.year || 'N/A'} icon={CalendarIcon} />
                    <InfoRow
                      label="Capacity"
                      value={truck.capacity ? `${truck.capacity} tons` : 'N/A'}
                      icon={ChartBarIcon}
                    />
                    <InfoRow label="Type" value={truck.type || 'N/A'} icon={CubeIcon} />
                    <Link
                      to={`${basePath}/truck-history/${truck._id}`}
                      className="mt-3 inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium"
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
                  <CalendarIcon className="h-5 w-5 text-gray-600" />
                  Schedule Dates
                </h2>
                <div className="space-y-3">
                  <InfoRow label="Planned Departure" value={formatDateTime(shipment.plannedDepartureDate)} icon={CalendarIcon} />
                  <InfoRow label="Planned Delivery" value={formatDateTime(shipment.plannedDeliveryDate)} icon={CalendarIcon} />
                  {shipment.actualDepartureDate && (
                    <InfoRow label="Actual Departure" value={formatDateTime(shipment.actualDepartureDate)} icon={PlayCircleIcon} />
                  )}
                  {shipment.actualDeliveryDate && (
                    <InfoRow label="Actual Delivery" value={formatDateTime(shipment.actualDeliveryDate)} icon={CheckCircleIcon} />
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                  Additional Information
                </h2>
                <div className="space-y-3">
                  <InfoRow label="Shipment ID" value={shipment.shipmentId || shipment._id} icon={ClipboardDocumentListIcon} />
                  <InfoRow label="Created By" value={shipment.createdBy?.name || 'N/A'} icon={UserIcon} />
                  <InfoRow label="Created At" value={formatDateTime(shipment.createdAt)} icon={CalendarIcon} />
                  {shipment.assignedTo && (
                    <InfoRow
                      label="Assigned To"
                      value={typeof shipment.assignedTo === 'object' ? shipment.assignedTo.name : shipment.assignedTo}
                      icon={UserGroupIcon}
                    />
                  )}
                  {shipment.cancellationReason && (
                    <InfoRow label="Cancellation Reason" value={shipment.cancellationReason} icon={ExclamationTriangleIcon} />
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {shipment.notes && shipment.notes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                    Notes ({shipment.notes.length})
                  </h2>
                  <div className="space-y-3">
                    {shipment.notes.map((note, index) => (
                      <div key={note._id || index} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-gray-600">
                            {note.createdByName || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(note.createdAt)}</span>
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
    </div>
  );
};

export default ShipmentHistory;