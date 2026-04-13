import React, { useState } from 'react';
import {
  TruckIcon,
  UserIcon,
  MapPinIcon,
  ScaleIcon,
  EyeIcon,
  XMarkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  CubeIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getStatusBadge, getStatusText } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';

const getTypeIcon = (type) => {
  switch (type) {
    case 'refrigerated': return '❄️';
    case 'fragile': return '📦';
    default: return '📦';
  }
};

const getPriorityColor = (isPriority) => {
  return isPriority
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';
};

const ShipmentDetailsModal = ({ shipment, onClose, onAssign, onCancel, onDelete }) => {
  const navigate = useNavigate(); 
  if (!shipment) return null;

  const statusBadgeClass = getStatusBadge(shipment.status, 'shipment', 'md');
  const statusText = getStatusText(shipment.status);
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  };

  const canAssign = shipment.status === 'pending';
  const canCancel = shipment.status === 'assigned' || shipment.status === 'pending';
  const canDelete = shipment.status === 'pending';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Shipment Details</h2>
            <p className="text-sm text-gray-500 font-mono mt-0.5">
              {shipment.shipmentId || shipment._id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={statusBadgeClass}>{statusText}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Priority + Type + Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(shipment.isPriority)}`}>
                {shipment.isPriority ? 'Priority' : 'Normal'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">{getTypeIcon(shipment.shipmentType)}</span>
              <span className="text-sm text-gray-700 capitalize">{shipment.shipmentType || 'Normal'}</span>
            </div>
            <div className="col-span-2 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Created: {formatDate(shipment.createdAt)}</span>
              </div>
              {shipment.updatedAt && shipment.updatedAt !== shipment.createdAt && (
                <div className="flex items-center gap-1">
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Updated: {formatDate(shipment.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {shipment.description && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">{shipment.description}</p>
            </div>
          )}

          {/* Route */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" /> Route
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Origin</p>
                <p className="text-gray-800 font-medium">{shipment.origin?.address || shipment.origin || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Destination</p>
                <p className="text-gray-800 font-medium">{shipment.destination?.address || shipment.destination || '—'}</p>
              </div>
            </div>
          </div>
          {/* Schedule */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Schedule
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Planned Departure</p>
                <p className="text-gray-800">{formatDate(shipment.plannedDepartureDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Planned Delivery</p>
                <p className="text-gray-800">{formatDate(shipment.plannedDeliveryDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Actual Departure</p>
                <p className="text-gray-800">{formatDate(shipment.actualDepartureDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Actual Delivery</p>
                <p className="text-gray-800">{formatDate(shipment.actualDeliveryDate)}</p>
              </div>
            </div>
            {shipment.actualDeliveryDate && shipment.plannedDeliveryDate && 
              new Date(shipment.actualDeliveryDate) > new Date(shipment.plannedDeliveryDate) && (
              <div className="mt-3 p-2 bg-red-50 text-red-700 rounded text-sm flex items-center gap-2">
                <span>⚠️</span> Delivery delayed by {Math.round((new Date(shipment.actualDeliveryDate) - new Date(shipment.plannedDeliveryDate)) / (1000 * 60))} minutes
              </div>
            )}
          </div>

          {/* Cargo */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CubeIcon className="h-4 w-4" /> Cargo
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-gray-500">Weight</label>
                <p className="text-gray-800">{shipment.weightKg} kg</p>
              </div>
            </div>
          </div>
          {/* Loading Duration Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ClockIcon className="h-4 w-4" /> Loading Duration
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-xs text-gray-500">Planned (min)</p>
                <p className="text-lg font-bold">
                  {shipment.plannedLoadingDurationMinutes ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Actual (min)</p>
                <p className="text-lg font-bold">
                  {shipment.actualLoadingDurationMinutes != null
                    ? `${shipment.actualLoadingDurationMinutes.toFixed(1)}`
                    : shipment.loadingStartedAt && !shipment.loadingCompletedAt
                    ? 'In progress...'
                    : '—'}
                </p>
              </div>
            </div>
            {/* Timestamps (only shown if loading started) */}
            {shipment.loadingStartedAt && (
              <div className="text-xs text-gray-400 border-t pt-2 mt-1">
                <div>Started: {new Date(shipment.loadingStartedAt).toLocaleString()}</div>
                {shipment.loadingCompletedAt && (
                  <div>Completed: {new Date(shipment.loadingCompletedAt).toLocaleString()}</div>
                )}
              </div>
            )}
            {/* Overtime warning */}
            {shipment.plannedLoadingDurationMinutes &&
              shipment.actualLoadingDurationMinutes != null &&
              shipment.actualLoadingDurationMinutes > shipment.plannedLoadingDurationMinutes && (
                <div className="mt-3 p-2 bg-red-50 text-red-700 rounded text-sm flex items-center gap-2">
                  <span className="text-base">⚠️</span> Overtime: {Math.round(shipment.actualLoadingDurationMinutes - shipment.plannedLoadingDurationMinutes)} minutes
                </div>
              )}
          </div>
          {/* Assignment */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <TruckIcon className="h-4 w-4" /> Assignment
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Truck</p>
                {shipment.truck ? (
                  <div>
                    <p className="font-medium">{shipment.truck.licensePlate}</p>
                    <p className="text-sm text-gray-500">{shipment.truck.brand} {shipment.truck.model}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Not assigned</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Driver</p>
                {shipment.driver ? (
                  <div>
                    <p className="font-medium">{shipment.driver.name}</p>
                    <p className="text-sm text-gray-500">{shipment.driver.phone}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Not assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer */}
          {(shipment.customer?.name || shipment.customer?.phone) && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" /> Customer
              </h3>
              <div className="space-y-1">
                {shipment.customer.name && <p className="text-gray-800">{shipment.customer.name}</p>}
                {shipment.customer.phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3" /> {shipment.customer.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(canAssign || canCancel || canDelete) && (
                  <div className="flex justify-end gap-3 pt-2 border-t">
                    <button
            onClick={() => { navigate(`/shipment_manager/shipments/${shipment._id}`); onClose(); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            View Full Page →
          </button>

              <button
                onClick={() => { if (window.confirm('Delete this shipment? This action cannot be undone.')) onDelete(shipment._id); onClose(); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Delete Shipment
              </button>
              {canAssign && (
                <button onClick={() => { onAssign(); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Assign Shipment
                </button>
              )}
              {canCancel && (
                <button onClick={() => { if (window.confirm('Cancel this shipment?')) onCancel(shipment._id); onClose(); }} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
                  Cancel Shipment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShipmentCard = ({ shipment, onCancel, onDelete, onAssign, onEdit }) => {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate(); 
  const statusBadgeClass = getStatusBadge(shipment.status, 'shipment', 'sm');
  const statusText = getStatusText(shipment.status);

  const getStatusAccent = () => {
    switch (shipment.status) {
      case 'pending': return 'border-l-amber-300';
      case 'assigned': return 'border-l-blue-300';
      case 'in_progress': return 'border-l-sky-300';
      case 'completed': return 'border-l-emerald-300';
      case 'cancelled': return 'border-l-rose-300';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg border border-gray-200 hover:shadow-sm transition cursor-pointer overflow-hidden ${getStatusAccent()} border-l-4`}
        onClick={() => setShowDetails(true)}
      >
        <div className="px-3 pt-2 pb-1 flex justify-between items-start gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {shipment.shipmentId || shipment._id.slice(-6)}
            </span>
            <span className={statusBadgeClass}>{statusText}</span>
            <span className={`${getPriorityColor(shipment.isPriority)} text-xs px-1.5 py-0.5 rounded-full border`}>
              {shipment.isPriority ? 'P' : 'N'}
            </span>
          </div>
        </div>

        <div className="px-3 pb-1">
          <p className="text-sm font-medium text-gray-800 truncate">{shipment.description || 'No description'}</p>
        </div>

        <div className="px-3 pb-1 flex items-center gap-1 text-xs text-gray-500">
          <MapPinIcon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{shipment.origin?.address || shipment.origin || '?'}</span>
          <span>→</span>
          <span className="truncate">{shipment.destination?.address || shipment.destination || '?'}</span>
        </div>

        <div className="px-3 pb-2 flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 mt-1 pt-1">
          <span title="Type">{getTypeIcon(shipment.shipmentType)}</span>
          <span title="Weight" className="flex items-center gap-0.5"><ScaleIcon className="h-3 w-3" />{shipment.weightKg}</span>
          {shipment.truck && <span title="Truck" className="flex items-center gap-0.5"><TruckIcon className="h-3 w-3" />{shipment.truck.licensePlate}</span>}
          {shipment.driver && <span title="Driver" className="flex items-center gap-0.5"><UserIcon className="h-3 w-3" />{shipment.driver.name.split(' ')[0]}</span>}
        </div>

        <div className="px-3 py-1.5 border-t border-gray-100 flex justify-end gap-1.5">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/shipment_manager/shipments/${shipment._id}`); }} 
            className="text-gray-400 hover:text-blue-600 p-0.5" 
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(shipment); }}
            className="text-xs bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700"
            title="Edit shipment"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(shipment._id); }}
            className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700"
            title="Delete shipment"
          >
            Del
          </button>
         {shipment.status === 'assigned' && (
            <button onClick={(e) => { e.stopPropagation(); onCancel(shipment._id); }} className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded hover:bg-amber-700">
              Cancel
            </button>
          )}

          {shipment.status === 'in_progress' && <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Moving</span>}
          {shipment.status === 'completed' && <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">✓</span>}
          {shipment.status === 'cancelled' && <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded">✗</span>}
        </div>
      </div>

      {showDetails && (
        <ShipmentDetailsModal
          shipment={shipment}
          onClose={() => setShowDetails(false)}
          onAssign={onAssign}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default ShipmentCard;