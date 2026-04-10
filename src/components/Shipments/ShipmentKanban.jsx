import React, { useState } from 'react';
import ShipmentCard from './ShipmentCard';
import toast from 'react-hot-toast';

const columns = [
  { id: 'pending', title: 'Pending', statusColor: 'amber', icon: '⏳' },
  { id: 'assigned', title: 'Assigned', statusColor: 'blue', icon: '📋' },
  { id: 'in_progress', title: 'In Progress', statusColor: 'sky', icon: '🚚' },
  { id: 'completed', title: 'Completed', statusColor: 'emerald', icon: '✅' },
  { id: 'cancelled', title: 'Cancelled', statusColor: 'rose', icon: '❌' },
];

const emptyMessages = {
  pending: 'No pending shipments',
  assigned: 'No assigned shipments',
  in_progress: 'No active deliveries',
  completed: 'No completed shipments',
  cancelled: 'No cancelled shipments',
};

const ShipmentKanban = ({ shipments, onAssign, onCancel, onDelete, onEdit  }) => {
  const [draggedShipment, setDraggedShipment] = useState(null);

  const getShipmentsByStatus = (status) => shipments.filter(s => s.status === status);

  const handleDragStart = (shipment) => setDraggedShipment(shipment);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (targetStatus) => {
    if (!draggedShipment) return;
    if (draggedShipment.status === 'pending' && targetStatus === 'assigned') {
      onAssign(draggedShipment);
    } else if (draggedShipment.status === 'assigned' && targetStatus === 'in_progress') {
      toast.info('Mission will auto-start when truck moves');
    } else {
      toast.error(`Cannot move from ${draggedShipment.status} to ${targetStatus}`);
    }
    setDraggedShipment(null);
  };

  const getHeaderBorderColor = (statusColor) => ({
    amber: 'border-amber-300',
    blue: 'border-blue-300',
    sky: 'border-sky-300',
    emerald: 'border-emerald-300',
    rose: 'border-rose-300',
  }[statusColor] || 'border-gray-300');

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => (
          <div
            key={column.id}
            className="w-80 bg-gray-50/80 rounded-xl p-3 border border-gray-200 shadow-sm flex-shrink-0"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className={`flex justify-between items-center mb-2 pb-1 border-b-2 ${getHeaderBorderColor(column.statusColor)}`}>
              <div className="flex items-center gap-1">
                <span className="text-base">{column.icon}</span>
                <h3 className="font-medium text-gray-700 text-sm">{column.title}</h3>
              </div>
              <span className="bg-white px-1.5 py-0.5 rounded-full text-xs font-medium text-gray-600 shadow-sm">
                {getShipmentsByStatus(column.id).length}
              </span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {getShipmentsByStatus(column.id).map((shipment) => (
                <div
                  key={shipment._id}
                  draggable={shipment.status === 'pending' || shipment.status === 'assigned'}
                  onDragStart={() => handleDragStart(shipment)}
                >
                  <ShipmentCard
                    shipment={shipment}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onAssign={() => onAssign(shipment)}
                    onEdit={() => onEdit(shipment)} 
                  />
                </div>
              ))}
              {getShipmentsByStatus(column.id).length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs italic">
                  {emptyMessages[column.id] || 'Empty'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShipmentKanban;