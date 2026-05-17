import React, { useState } from 'react';
import {
  MapPinIcon,
  ScaleIcon,
  TruckIcon,
  UserIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowPathIcon,
  PencilIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
  XCircleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { getStatusBadge, getStatusText } from '../../constants/colors';

// ── Utilities ────────────────────────────────────────────────

const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatDuration = (hours) => {
  if (!hours && hours !== 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const getTypeIcon = (type) => {
  switch (type) { case 'refrigerated': return ''; case 'fragile': return ''; default: return ''; }
};

const getTypeColor = (type) => {
  switch (type) {
case 'refrigerated': return 'bg-teal-100 text-teal-700 border border-teal-200';
case 'fragile':      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
default:             return 'bg-blue-100 text-blue-700 border border-blue-200';
  }
};

const getStatusAccent = (status) => {
  switch (status) {
    case 'pending':     return 'border-l-yellow-400';
    case 'assigned':    return 'border-l-blue-400';
    case 'in_progress': return 'border-l-blue-400';
    case 'completed':   return 'border-l-teal-400';
    case 'cancelled':   return 'border-l-orange-400';
    default:            return 'border-l-gray-300';
  }
};

// ── Sub-components ────────────────────────────────────────────

const StatusHeader = ({ shipmentId, status, statusText, isPriority, onViewDetails }) => (
  <div className="flex justify-between items-start gap-2">
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg flex-shrink-0">
        #{shipmentId}
      </span>
      <span className={getStatusBadge(status, 'shipment', 'sm')}>{statusText}</span>
      {isPriority && (
        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-200 flex-shrink-0">
          Priority
        </span>
      )}
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
      title="View details"
    >
      <EyeIcon className="h-4 w-4" />
    </button>
  </div>
);

const RouteInfo = ({ origin, destination }) => (
  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 mb-0.5">From</p>
      <p className="text-xs font-semibold text-gray-700 truncate">{origin || '?'}</p>
    </div>
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div className="w-1 h-1 rounded-full bg-gray-300" />
      <div className="w-4 h-px bg-gray-300" />
      <TruckIcon className="h-3 w-3 text-gray-400" />
      <div className="w-4 h-px bg-gray-300" />
      <div className="w-1 h-1 rounded-full bg-gray-400" />
    </div>
    <div className="flex-1 min-w-0 text-right">
      <p className="text-xs text-gray-400 mb-0.5">To</p>
      <p className="text-xs font-semibold text-gray-700 truncate">{destination || '?'}</p>
    </div>
  </div>
);

const AssignmentBadge = ({ truck, driver }) => (
  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
    <TruckIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
    <span className="text-xs font-semibold text-blue-700">{truck?.licensePlate || 'Unknown'}</span>
    {driver && (
      <>
        <span className="text-blue-300">·</span>
        <UserIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        <span className="text-xs text-blue-600">{driver.name?.split(' ')[0]}</span>
      </>
    )}
  </div>
);

const DurationBadge = ({ estimatedDuration, isUrgent, daysUntilDelivery, isOverdue }) => (
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-1.5 text-gray-500">
      <ClockIcon className="h-3.5 w-3.5 text-teal-400" />
      <span>Est. duration:</span>
      <span className="font-semibold text-gray-700">{estimatedDuration}</span>
    </div>
    {isUrgent && (
      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
        {daysUntilDelivery}d left
      </span>
    )}
    {isOverdue && (
      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
        {Math.abs(daysUntilDelivery)}d overdue
      </span>
    )}
  </div>
);

const Tags = ({ shipmentType, weightKg, customer, assignedTo }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(shipmentType)}`}>
      {getTypeIcon(shipmentType)} {shipmentType || 'standard'}
    </span>
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
      <ScaleIcon className="h-3 w-3" />
      {weightKg || 0}kg
    </span>
    {customer && (
      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
        {customer.name}
      </span>
    )}
    {assignedTo && typeof assignedTo === 'object' && (
      <span className="text-xs bg-blue-50 text-blue-700  px-2 py-0.5 rounded-full border  border-blue-200 flex items-center gap-1">
        <UserGroupIcon className="h-3 w-3" />
        {assignedTo.name?.split(' ')[0]}
      </span>
    )}
  </div>
);

const ActionButtons = ({ 
  onEdit, 
  onArchive, 
  onUnarchive, 
  onAssign, 
  onCancel, 
  onAssignManager, 
  status, 
  isAdmin, 
  shipmentId, 
  shipment, 
  isArchivedView 
}) => {
  const btn = (title, onClick, colorClass, icon) => (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-1.5 rounded-lg transition-all hover:scale-105 ${colorClass}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-0.5">
      {onEdit &&
        btn('Edit shipment', () => onEdit(shipment), 'text-gray-400 hover:text-teal-600 hover:bg-teal-50', <PencilIcon className="h-4 w-4" />)}
      {/* Archive / Restore – only show archive for completed/cancelled */}
      {shipment.isArchived ? (
        onUnarchive && (
          <button
            title="Restore shipment"
            onClick={(e) => { e.stopPropagation(); onUnarchive(shipmentId); }}
            className="text-gray-400 hover:text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-all"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
          </button>
        )
      ) : (
        (status === 'completed' || status === 'cancelled') && onArchive && (
          <button
            title="Archive shipment"
            onClick={(e) => { e.stopPropagation(); onArchive(shipmentId); }}
            className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-1.5 rounded-lg transition-all"
          >
            <ArchiveBoxArrowDownIcon className="h-4 w-4" />
          </button>
        )
      )}

      {/* Single button handles both assign and reassign — modal detects mode from shipment.status */}
      {['pending', 'assigned', 'in_progress'].includes(status) && onAssign &&
        btn(
          status === 'pending' ? 'Assign driver' : 'Reassign',
          () => onAssign(shipment),
          status === 'pending'
            ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50',
          status === 'pending'
            ? <UserPlusIcon className="h-4 w-4" />
            : <ArrowPathIcon className="h-4 w-4" />
        )}

      {!['completed', 'cancelled', 'in_progress'].includes(status) && onCancel &&
        btn('Cancel shipment', () => onCancel(shipmentId), 'text-gray-400 hover:text-amber-600 hover:bg-amber-50', <XCircleIcon className="h-4 w-4" />)}

      {isAdmin && onAssignManager &&
        btn('Assign manager', () => onAssignManager(shipment), 'text-gray-400 hover:text-blue-600 hover:bg-blue-50', <UserGroupIcon className="h-4 w-4" />)}
    </div>
  );
};

const StatusBadgeInline = ({ status }) => {
  const config = {
    in_progress: { text: 'In Transit',  Icon: TruckIcon,       color: 'bg-blue-50 text-blue-700 border-blue-200'     },
    completed:   { text: 'Completed',   Icon: CheckCircleIcon, color: 'bg-teal-50 text-teal-700 border-teal-200'     },
    cancelled:   { text: 'Cancelled',   Icon: XCircleIcon,     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  };
  const item = config[status];
  if (!item) return null;
  const { Icon, text, color } = item;
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 font-medium ${color}`}>
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
};

// ── Main Card ─────────────────────────────────────────────────

const ShipmentCard = ({
  shipment, onCancel, onAssign,
  onAssignManager, onEdit, onViewDetails, isAdmin, isArchivedView, onArchive, onUnarchive
}) => {
  if (!shipment) return null;

  const [isHovered, setIsHovered] = useState(false);
  const statusText = getStatusText(shipment.status);
  const isAssigned = shipment.truck != null;

  const getDaysUntilDelivery = () => {
    if (!shipment.plannedDeliveryDate) return null;
    return Math.ceil((new Date(shipment.plannedDeliveryDate) - new Date()) / 86400000);
  };

  const daysUntilDelivery = getDaysUntilDelivery();
  const isUrgent  = daysUntilDelivery !== null && daysUntilDelivery <= 2 && daysUntilDelivery >= 0;
  const isOverdue = daysUntilDelivery !== null && daysUntilDelivery < 0;

  const getEstimatedDuration = () => {
    if (!shipment.plannedDepartureDate || !shipment.plannedDeliveryDate) return null;
    const hours = (new Date(shipment.plannedDeliveryDate) - new Date(shipment.plannedDepartureDate)) / 3600000;
    return formatDuration(hours);
  };

  const handleViewDetails = () => onViewDetails?.(shipment);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${getStatusAccent(shipment.status)} overflow-hidden cursor-pointer transition-all duration-200 ${
        isHovered ? 'shadow-lg -translate-y-0.5' : 'shadow-sm hover:shadow-md'
      }`}
      onClick={handleViewDetails}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card body */}
      <div className="p-4 space-y-3">
        <StatusHeader
          shipmentId={shipment.shipmentId || shipment._id?.slice(-6)}
          status={shipment.status}
          statusText={statusText}
          isPriority={shipment.isPriority}
          onViewDetails={handleViewDetails}
        />

        <div>
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {shipment.description || 'No description'}
          </p>
          {shipment.goods && (
            <p className="text-xs text-gray-400 mt-0.5">{shipment.goods}</p>
          )}
        </div>

        <RouteInfo origin={shipment.origin} destination={shipment.destination} />

        {isAssigned && shipment.status === 'assigned' && (
          <AssignmentBadge truck={shipment.truck} driver={shipment.driver} />
        )}

        {getEstimatedDuration() && (
          <DurationBadge
            estimatedDuration={getEstimatedDuration()}
            isUrgent={isUrgent}
            daysUntilDelivery={daysUntilDelivery}
            isOverdue={isOverdue}
          />
        )}

        <Tags
          shipmentType={shipment.shipmentType}
          weightKg={shipment.weightKg}
          customer={shipment.customer}
          assignedTo={shipment.assignedTo}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
        <StatusBadgeInline status={shipment.status} />
        <ActionButtons
          onEdit={onEdit}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onAssign={onAssign}
          onCancel={onCancel}
          onAssignManager={onAssignManager}
          status={shipment.status}
          isAdmin={isAdmin}
          shipmentId={shipment._id}
          shipment={shipment}
          isArchivedView={isArchivedView}
        />
      </div>
    </div>
  );
};

export default ShipmentCard;