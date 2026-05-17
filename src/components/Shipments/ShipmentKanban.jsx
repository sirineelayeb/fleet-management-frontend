import React, { useState } from 'react';
import ShipmentCard from './ShipmentCard';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'pending',     title: 'Pending',     icon: '', bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-800',   accent: 'bg-amber-400'   },
  { id: 'assigned',    title: 'Assigned',    icon: '', bg: 'bg-blue-50',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-800',     accent: 'bg-blue-400'    },
  { id: 'in_progress', title: 'In Progress', icon: '', bg: 'bg-sky-50',     border: 'border-sky-200',     badge: 'bg-sky-100 text-sky-800',       accent: 'bg-sky-400'     },
  { id: 'completed',   title: 'Completed',   icon: '', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', accent: 'bg-emerald-400' },
  { id: 'cancelled',   title: 'Cancelled',   icon: '', bg: 'bg-rose-50',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-800',     accent: 'bg-rose-400'    },
];

const EMPTY_MESSAGES = {
  pending:     'No pending shipments',
  assigned:    'No assigned shipments',
  in_progress: 'No active deliveries',
  completed:   'No completed shipments',
  cancelled:   'No cancelled shipments',
};

const ShipmentKanban = ({ shipments, onAssign, onCancel, onDelete, onEdit, onAssignManager, isAdmin }) => {
  const [draggedShipment, setDraggedShipment] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const byStatus = (status) => shipments.filter(s => s.status === status);

  const handleDrop = (targetStatus) => {
    if (!draggedShipment) return;
    if (draggedShipment.status === 'pending' && targetStatus === 'assigned') {
      onAssign(draggedShipment);
    } else if (draggedShipment.status === 'assigned' && targetStatus === 'in_progress') {
      toast.info('Shipment will start automatically when the truck departs');
    } else {
      toast.error(`Cannot move from "${draggedShipment.status}" to "${targetStatus}"`);
    }
    setDraggedShipment(null);
    setDragOverColumn(null);
  };

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => {
          const colShipments = byStatus(col.id);
          const isDragOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className={`w-80 flex flex-col rounded-2xl bg-white border-2 transition-all duration-200 shadow-sm ${
                isDragOver ? `${col.border} shadow-lg scale-[1.01]` : 'border-gray-200'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.id); }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-b ${col.border} ${col.bg}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{col.icon}</span>
                  <h3 className="font-semibold text-gray-700 text-sm">{col.title}</h3>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${col.badge}`}>
                  {colShipments.length}
                </span>
              </div>

              {/* Cards */}
              <div className={`flex-1 p-2 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto transition-colors duration-200 ${isDragOver ? col.bg : ''}`}>
                {colShipments.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed transition-colors ${
                    isDragOver ? `${col.border} ${col.bg}` : 'border-gray-200'
                  }`}>
                    <span className="text-3xl mb-2 opacity-30">{col.icon}</span>
                    <p className="text-xs text-gray-400 font-medium text-center px-4">{EMPTY_MESSAGES[col.id]}</p>
                    {isDragOver && (
                      <p className="text-xs font-semibold mt-2 text-gray-500">Drop here</p>
                    )}
                  </div>
                ) : (
                  colShipments.map((shipment) => (
                    <div
                      key={shipment._id}
                      draggable={['pending', 'assigned'].includes(shipment.status)}
                      onDragStart={() => setDraggedShipment(shipment)}
                      onDragEnd={() => { setDraggedShipment(null); setDragOverColumn(null); }}
                      className={`transition-opacity duration-200 ${
                        draggedShipment?._id === shipment._id ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <ShipmentCard
                        shipment={shipment}
                        isAdmin={isAdmin}
                        onViewDetails={() => {}}
                        onAssign={() => onAssign(shipment)}
                        onAssignManager={() => onAssignManager?.(shipment)}
                        onCancel={() => onCancel(shipment._id)}
                        onDelete={() => onDelete(shipment._id)}
                        onEdit={() => onEdit(shipment)}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Drop zone indicator */}
              {isDragOver && draggedShipment && (
                <div className={`mx-2 mb-2 p-2 rounded-xl border-2 border-dashed ${col.border} ${col.bg} text-center`}>
                  <p className="text-xs font-semibold text-gray-500">Release to move here</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShipmentKanban;