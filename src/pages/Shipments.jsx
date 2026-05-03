import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { shipmentService } from '../services/shipmentService';
import { truckService } from '../services/truckService';
import { driverService } from '../services/driverService';
import ShipmentCard from '../components/Shipments/ShipmentCard';
import AssignShipmentModal from '../components/Shipments/AssignShipmentModal';
import AssignManagerModal from '../components/Shipments/AssignManagerModal';
import ShipmentForm from '../components/Shipments/ShipmentForm';
import ShipmentDetailsModal from '../components/Shipments/ShipmentDetailsModal';
import Modal from '../components/Common/Modal';
import {
  PlusIcon,
  ArrowPathIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 50;

const STATUS_COLUMNS = [
  { status: 'pending',     label: 'Pending',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200'       },
  { status: 'assigned',    label: 'Assigned',    dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 ring-blue-200'          },
  { status: 'in_progress', label: 'In Progress', dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 ring-sky-200'             },
  { status: 'completed',   label: 'Completed',   dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { status: 'cancelled',   label: 'Cancelled',   dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-700 ring-rose-200'          },
];

const STAT_CONFIG = [
  { key: 'total',     label: 'Total',     icon: TruckIcon,       color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'active',    label: 'Active',    icon: ClockIcon,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { key: 'completed', label: 'Completed', icon: CheckCircleIcon, color: 'text-emerald-600',bg: 'bg-emerald-50'},
  { key: 'cancelled', label: 'Cancelled', icon: XCircleIcon,     color: 'text-rose-600',   bg: 'bg-rose-50'   },
];

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
    <div className={`${bg} ${color} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

// ─── Kanban Column ────────────────────────────────────────────
const KanbanColumn = ({ config, shipments, onAction, isAdmin }) => (
  <div className="w-72 shrink-0 flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
    <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className="text-sm font-semibold text-gray-700">{config.label}</span>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ring-1 ${config.badge}`}>
        {shipments.length}
      </span>
    </div>

    <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
      {shipments.length === 0 ? (
        <p className="text-center text-xs text-gray-400 py-8">No shipments</p>
      ) : (
        shipments.map((shipment) => (
          <ShipmentCard
            key={shipment._id}
            shipment={shipment}
            isAdmin={isAdmin}
            onViewDetails={onAction.handleViewDetails}
            onAssign={() => onAction.openAssign(shipment)}
            onAssignManager={() => onAction.openManager(shipment)}
            onCancel={() => onAction.handleCancel(shipment._id)}
            onDelete={() => onAction.handleDelete(shipment._id)}
            onEdit={() => onAction.handleEdit(shipment)}
          />
        ))
      )}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────
const Shipments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [statusFilter, setStatusFilter]         = useState('all');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [detailShipment, setDetailShipment]     = useState(null);
  const [editingShipment, setEditingShipment]   = useState(null);
  const [showAssignModal, setShowAssignModal]   = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);

  // ── Queries ──
  const { data: shipmentsRes, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentService.getAll({ limit: PAGE_SIZE }),
  });
  const { data: trucksRes  } = useQuery({ queryKey: ['trucks'],   queryFn: () => truckService.getAll()  });
  const { data: driversRes } = useQuery({ queryKey: ['drivers'],  queryFn: () => driverService.getAll() });

  const allShipments = shipmentsRes?.data || [];
  const trucks       = trucksRes?.data    || [];
  const drivers      = driversRes?.data   || [];

  // ── Derived ──
  const byStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.status] = allShipments.filter(s => s.status === col.status);
    return acc;
  }, {});

  const counts = {
    ...Object.fromEntries(STATUS_COLUMNS.map(c => [c.status, byStatus[c.status].length])),
    total:  allShipments.length,
    active: ['pending', 'assigned', 'in_progress'].reduce((n, k) => n + (byStatus[k]?.length ?? 0), 0),
  };

  const filtered = statusFilter === 'all'
    ? allShipments
    : allShipments.filter(s => s.status === statusFilter);

  // ── Mutations ──
  const invalidate = () => queryClient.invalidateQueries(['shipments']);

  const assignMutation = useMutation({
    mutationFn: ({ shipmentId, truckId, driverId }) => shipmentService.assign(shipmentId, truckId, driverId),
    onSuccess: () => { invalidate(); toast.success('Shipment assigned'); closeAssign(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Assign failed'),
  });
  const unassignMutation = useMutation({
    mutationFn: (id) => shipmentService.unassign(id),
    onSuccess: () => { invalidate(); toast.success('Unassigned'); closeAssign(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Unassign failed'),
  });
  const assignManagerMutation = useMutation({
    mutationFn: ({ shipmentId, managerId }) => shipmentService.assignToManager(shipmentId, managerId),
    onSuccess: () => { invalidate(); toast.success('Manager assigned'); closeManager(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Assign manager failed'),
  });
  const unassignManagerMutation = useMutation({
    mutationFn: (id) => shipmentService.unassignManager(id),
    onSuccess: () => { invalidate(); toast.success('Manager unassigned'); closeManager(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Unassign manager failed'),
  });
  const cancelMutation = useMutation({
    mutationFn: ({ id }) => shipmentService.cancel(id),
    onSuccess: () => { invalidate(); toast.success('Shipment cancelled'); setDetailShipment(null); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Cancel failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => shipmentService.delete(id),
    onSuccess: () => { invalidate(); toast.success('Shipment deleted'); setDetailShipment(null); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => shipmentService.update(id, data),
    onSuccess: () => { invalidate(); toast.success('Shipment updated'); setShowEditModal(false); setEditingShipment(null); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  // ── Helpers ──
  const closeAssign  = () => { setShowAssignModal(false);  setSelectedShipment(null); };
  const closeManager = () => { setShowManagerModal(false); setSelectedShipment(null); };
  const openAssign   = (s) => { setSelectedShipment(s); setShowAssignModal(true);  };
  const openManager  = (s) => { setSelectedShipment(s); setShowManagerModal(true); };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this shipment? This will free the truck and driver.')) return;
    await cancelMutation.mutateAsync({ id });
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shipment? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(id);
  };
  const handleEdit = (shipment) => { setEditingShipment(shipment); setShowEditModal(true); };

  const handleReassign = async (shipmentId, truckId, driverId) => {
    try {
      await shipmentService.reassign(shipmentId, truckId, driverId);
      toast.success('Shipment reassigned');
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reassign');
    }
  };

  const actions = {
    handleViewDetails: setDetailShipment,
    handleCancel,
    handleDelete,
    handleEdit,
    openAssign,
    openManager,
  };

  const createPath = isAdmin
    ? '/dashboard/shipments/create'
    : '/shipment_manager/shipments/create';

  // ── Loading ──
  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
          <TruckIcon className="w-6 h-6 text-white animate-pulse" />
        </div>
        <p className="text-sm text-gray-400">Loading shipments…</p>
      </div>
    </div>
  );

  const activeColConfig = STATUS_COLUMNS.find(c => c.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Shipments</h1>
              <p className="text-xs text-gray-400">Track and manage all shipments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate(createPath)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Shipment
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_CONFIG.map(({ key, label, icon, color, bg }) => (
            <StatCard key={key} label={label} value={counts[key]} icon={icon} color={color} bg={bg} />
          ))}
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {counts.total}
            </span>
          </button>

          {STATUS_COLUMNS.map(col => (
            <button
              key={col.status}
              onClick={() => setStatusFilter(col.status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                statusFilter === col.status
                  ? `ring-1 ${col.badge}`
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
              {col.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === col.status ? col.badge : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[col.status]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Kanban / Grid ── */}
        {statusFilter === 'all' ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STATUS_COLUMNS.map(config => (
              <KanbanColumn
                key={config.status}
                config={config}
                shipments={byStatus[config.status]}
                onAction={actions}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span>{' '}
              {activeColConfig?.label.toLowerCase()} shipments
            </p>

            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-20 gap-1">
                <p className="text-sm font-medium text-gray-500">No {activeColConfig?.label.toLowerCase()} shipments</p>
                <p className="text-xs text-gray-400">Try a different filter or create a new shipment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.filter(s => s?._id).map(shipment => (
                  <ShipmentCard
                    key={shipment._id}
                    shipment={shipment}
                    isAdmin={isAdmin}
                    onViewDetails={setDetailShipment}
                    onAssign={() => openAssign(shipment)}
                    onReassign={() => openAssign(shipment)}
                    onAssignManager={() => openManager(shipment)}
                    onCancel={() => handleCancel(shipment._id)}
                    onDelete={() => handleDelete(shipment._id)}
                    onEdit={() => handleEdit(shipment)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showAssignModal && selectedShipment && (
        <AssignShipmentModal
          shipment={selectedShipment}
          trucks={trucks}
          drivers={drivers}
          onClose={closeAssign}
          onAssign={(shipmentId, truckId, driverId) => assignMutation.mutateAsync({ shipmentId, truckId, driverId })}
          onReassign={handleReassign}
          onUnassign={(id) => unassignMutation.mutateAsync(id)}
        />
      )}

      {showManagerModal && selectedShipment && (
        <AssignManagerModal
          shipment={selectedShipment}
          onClose={closeManager}
          onAssign={(shipmentId, managerId) => assignManagerMutation.mutateAsync({ shipmentId, managerId })}
          onUnassign={(id) => unassignManagerMutation.mutateAsync(id)}
        />
      )}

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingShipment(null); }}
        title="Edit Shipment"
        size="lg"
      >
        {editingShipment && (
          <ShipmentForm
            key={editingShipment._id}
            initialData={editingShipment}
            onSubmit={(data) => updateMutation.mutateAsync({ id: editingShipment._id, data })}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {detailShipment && (
        <ShipmentDetailsModal
          shipment={detailShipment}
          onClose={() => setDetailShipment(null)}
          onAssign={() => { openAssign(detailShipment); setDetailShipment(null); }}
          onCancel={() => handleCancel(detailShipment._id)}
          onDelete={() => handleDelete(detailShipment._id)}
          onEdit={() => { handleEdit(detailShipment); setDetailShipment(null); }}
        />
      )}
    </div>
  );
};

export default Shipments;