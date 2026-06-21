import React, { useState, useMemo } from 'react';
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
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { semantic } from '../constants/colors';

const PAGE_SIZE = 50;

const STATUS_COLUMNS = [
  { status: 'pending',     label: 'Pending',     color: 'warning' },
  { status: 'assigned',    label: 'Assigned',    color: 'info'    },
  { status: 'in_progress', label: 'In Progress', color: 'success' },
  { status: 'completed',   label: 'Completed',   color: 'success' },
  { status: 'cancelled',   label: 'Cancelled',   color: 'danger'  },
];

const STAT_CONFIG = [
  { key: 'total',     label: 'Total',     icon: TruckIcon,       color: 'blue'   },
  { key: 'active',    label: 'Active',    icon: ClockIcon,       color: 'teal'   },
  { key: 'completed', label: 'Completed', icon: CheckCircleIcon, color: 'teal'   },
  { key: 'cancelled', label: 'Cancelled', icon: XCircleIcon,     color: 'orange' },
];

const getStatusColorClasses = (status, type = 'bg') => {
  const colors = {
    pending:     { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    assigned:    { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200',  dot: 'bg-blue-500'  },
    in_progress: { bg: 'bg-teal-50',  text: 'text-teal-700',  border: 'border-teal-200',  dot: 'bg-teal-500'  },
    completed:   { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
    cancelled:   { bg: 'bg-rose-50',  text: 'text-rose-700',  border: 'border-rose-200',  dot: 'bg-rose-500'  },
  };
  const c = colors[status] || colors.pending;
  if (type === 'bg')     return c.bg;
  if (type === 'text')   return c.text;
  if (type === 'border') return c.border;
  if (type === 'dot')    return c.dot;
  return '';
};

const matchesSearch = (shipment, query) => {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return [
    shipment.shipmentId,
    shipment._id,
    shipment.description,
    shipment.origin,
    shipment.destination,
    shipment.goods,
    shipment.driver?.name,
    shipment.truck?.licensePlate,
    shipment.customer?.name,
  ].some(field => field?.toLowerCase().includes(q));
};

// ─── Sub‑components ──────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue:   'bg-blue-50 text-blue-600',
    teal:   'bg-teal-50 text-teal-600',
    orange: 'bg-orange-50 text-orange-600',
    green:  'bg-green-50 text-green-600',
    gray:   'bg-gray-50 text-gray-600',
  };
  const iconColor = colorClasses[color] || colorClasses.gray;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow shadow-sm">
      <div className={`rounded-lg p-2 flex items-center justify-center shrink-0 ${iconColor.split(' ')[0]}`}>
        <Icon className={`w-5 h-5 ${iconColor.split(' ')[1]}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
};

// ─── Kanban column — NO max-h, NO overflow-y-auto ────────────
// Cards simply stack and the page's own scroll handles overflow.
const KanbanColumn = ({ config, shipments, onAction, isAdmin }) => {
  const bgClass     = getStatusColorClasses(config.status, 'bg');
  const borderClass = getStatusColorClasses(config.status, 'border');
  const dotClass    = getStatusColorClasses(config.status, 'dot');
  const textClass   = getStatusColorClasses(config.status, 'text');

  return (
    <div className="w-72 shrink-0 flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${borderClass} bg-white dark:bg-gray-800`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{config.label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bgClass} ${textClass}`}>
          {shipments.length}
        </span>
      </div>

      {/* Cards — no height cap, no scrollbar */}
      <div className="p-2 space-y-2">
        {shipments.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8">No shipments</p>
        ) : (
          shipments.map(shipment => (
            <ShipmentCard
              key={shipment._id}
              shipment={shipment}
              isAdmin={isAdmin}
              onViewDetails={onAction.handleViewDetails}
              onAssign={() => onAction.openAssign(shipment)}
              onAssignManager={() => onAction.openManager(shipment)}
              onCancel={() => onAction.handleCancel(shipment._id)}
              onArchive={() => onAction.handleArchive(shipment._id)}
              onUnarchive={() => onAction.handleUnarchive(shipment._id)}
              onEdit={() => onAction.handleEdit(shipment)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const StatusFilterTabs = ({ statusFilter, setStatusFilter, counts }) => {
  const tabs = [
    { id: 'all', label: 'All', count: counts.total },
    ...STATUS_COLUMNS.map(col => ({
      id: col.status,
      label: col.label,
      count: counts[col.status],
      dotColor:  getStatusColorClasses(col.status, 'dot'),
      bgColor:   getStatusColorClasses(col.status, 'bg'),
      textColor: getStatusColorClasses(col.status, 'text'),
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tabs.map((tab) => {
        const isActive = statusFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? tab.id === 'all'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : `${tab.bgColor} ${tab.textColor} ring-1 ring-inset ring-current/20`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.id !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />}
            <span>{tab.label}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                isActive
                  ? tab.id === 'all'
                    ? 'bg-white/20 text-white'
                    : `${tab.bgColor} ${tab.textColor} ring-1 ring-inset ring-current/20`
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const ArchiveFilter = ({ archivedFilter, setArchivedFilter, setStatusFilter }) => {
  const options = [
    { value: 'current',  label: 'Current Shipments'  },
    { value: 'archived', label: 'Archived Shipments' },
    { value: 'all',      label: 'All Shipments'      },
  ];

  return (
    <div className="relative">
      <select
        value={archivedFilter}
        onChange={(e) => { setArchivedFilter(e.target.value); setStatusFilter('all'); }}
        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <FunnelIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

const SearchBar = ({ searchQuery, setSearchQuery }) => (
  <div className="relative flex-1 max-w-md">
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search by ID, origin, destination, driver, truck..."
      className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────
const Shipments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [statusFilter, setStatusFilter]     = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [archivedFilter, setArchivedFilter] = useState('current');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [detailShipment, setDetailShipment]     = useState(null);
  const [editingShipment, setEditingShipment]   = useState(null);
  const [showAssignModal, setShowAssignModal]   = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);

  const archivedParam = archivedFilter === 'all' ? undefined : archivedFilter === 'archived';

  const { data: shipmentsRes, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['shipments', archivedParam],
    queryFn: async () => {
      const params = { limit: PAGE_SIZE };
      if (archivedParam !== undefined) params.archived = archivedParam;
      return shipmentService.getAll(params);
    },
  });

  const { data: trucksRes  } = useQuery({ queryKey: ['trucks'],  queryFn: () => truckService.getAll()  });
  const { data: driversRes } = useQuery({ queryKey: ['drivers'], queryFn: () => driverService.getAll() });

  const allShipments = shipmentsRes?.data || [];
  const trucks       = trucksRes?.data    || [];
  const drivers      = driversRes?.data   || [];

  const byStatus = useMemo(() =>
    STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.status] = allShipments.filter(s => s.status === col.status);
      return acc;
    }, {}),
  [allShipments]);

  const counts = useMemo(() => ({
    ...Object.fromEntries(STATUS_COLUMNS.map(c => [c.status, byStatus[c.status].length])),
    total:  allShipments.length,
    active: ['pending', 'assigned', 'in_progress'].reduce((n, k) => n + (byStatus[k]?.length ?? 0), 0),
  }), [allShipments, byStatus]);

  const filtered = useMemo(() => {
    const byStatusFiltered = statusFilter === 'all'
      ? allShipments
      : allShipments.filter(s => s.status === statusFilter);
    return byStatusFiltered.filter(s => matchesSearch(s, searchQuery));
  }, [allShipments, statusFilter, searchQuery]);

  const filteredByStatus = useMemo(() =>
    STATUS_COLUMNS.reduce((acc, col) => {
      acc[col.status] = (byStatus[col.status] || []).filter(s => matchesSearch(s, searchQuery));
      return acc;
    }, {}),
  [byStatus, searchQuery]);

  const invalidate = () => queryClient.invalidateQueries(['shipments']);

  const archiveMutation         = useMutation({ mutationFn: (id) => shipmentService.archive(id),   onSuccess: () => { invalidate(); toast.success('Shipment archived');  }, onError: (e) => toast.error(e.response?.data?.message || 'Archive failed')         });
  const unarchiveMutation       = useMutation({ mutationFn: (id) => shipmentService.unarchive(id), onSuccess: () => { invalidate(); toast.success('Shipment restored');  }, onError: (e) => toast.error(e.response?.data?.message || 'Restore failed')         });
  const assignMutation          = useMutation({ mutationFn: ({ shipmentId, truckId, driverId }) => shipmentService.assign(shipmentId, truckId, driverId), onSuccess: () => { invalidate(); toast.success('Shipment assigned');   closeAssign();  }    });
  const assignManagerMutation   = useMutation({ mutationFn: ({ shipmentId, managerId }) => shipmentService.assignToManager(shipmentId, managerId),        onSuccess: () => { invalidate(); toast.success('Manager assigned');   closeManager(); }, onError: (e) => toast.error(e.response?.data?.message || 'Assign manager failed')  });
  const unassignManagerMutation = useMutation({ mutationFn: (id) => shipmentService.unassignManager(id), onSuccess: () => { invalidate(); toast.success('Manager unassigned'); closeManager(); }, onError: (e) => toast.error(e.response?.data?.message || 'Unassign manager failed') });
  const cancelMutation          = useMutation({ mutationFn: ({ id }) => shipmentService.cancel(id),      onSuccess: () => { invalidate(); toast.success('Shipment cancelled'); setDetailShipment(null); }, onError: (e) => toast.error(e.response?.data?.message || 'Cancel failed')          });
  const deleteMutation          = useMutation({ mutationFn: (id) => shipmentService.delete(id),          onSuccess: () => { invalidate(); toast.success('Shipment deleted');   setDetailShipment(null); }, onError: (e) => toast.error(e.response?.data?.message || 'Delete failed')          });
  const updateMutation          = useMutation({ mutationFn: ({ id, data }) => shipmentService.update(id, data), onSuccess: () => { invalidate(); toast.success('Shipment updated'); setShowEditModal(false); setEditingShipment(null); }, onError: (e) => toast.error(e.response?.data?.message || 'Update failed') });

  const closeAssign  = () => { setShowAssignModal(false);  setSelectedShipment(null); };
  const closeManager = () => { setShowManagerModal(false); setSelectedShipment(null); };
  const openAssign   = (s) => { setSelectedShipment(s); setShowAssignModal(true);  };
  const openManager  = (s) => { setSelectedShipment(s); setShowManagerModal(true); };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this shipment? This will free the truck and driver.')) return;
    await cancelMutation.mutateAsync({ id }).catch(() => {}); // onError handles the toast
  };  
  const handleArchive   = (id) => { if (window.confirm('Archive this shipment?'))  archiveMutation.mutate(id); };
  const handleUnarchive = (id) => { if (window.confirm('Restore this shipment?'))  unarchiveMutation.mutate(id); };
  const handleEdit      = (shipment) => { setEditingShipment(shipment); setShowEditModal(true); };

  const handleReassign = async (shipmentId, truckId, driverId) => {
  // No try/catch here — let the error bubble up to the modal
  await shipmentService.reassign(shipmentId, truckId, driverId);
  toast.success('Shipment reassigned');
  refetch();
};

  const actions = { handleViewDetails: setDetailShipment, handleCancel, handleArchive, handleUnarchive, handleEdit, openAssign, openManager };

  const createPath      = isAdmin ? '/dashboard/shipments/create' : '/shipment_manager/shipments/create';
  const activeColConfig = STATUS_COLUMNS.find(c => c.status === statusFilter);
  const isSearching     = searchQuery.trim().length > 0;

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
          <TruckIcon className="w-6 h-6 text-white animate-pulse" />
        </div>
        <p className="text-sm text-gray-400">Loading shipments...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
            <TruckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Shipments</h1>
            <p className="text-xs text-gray-400">Track and manage all shipments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate(createPath)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Shipment
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CONFIG.map(({ key, label, icon, color }) => (
          <StatCard key={key} label={label} value={counts[key]} icon={icon} color={color} />
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <ArchiveFilter
            archivedFilter={archivedFilter}
            setArchivedFilter={setArchivedFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
        <StatusFilterTabs
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          counts={counts}
        />
      </div>

      {/* Search hint */}
      {isSearching && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Found <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''} for{' '}
            <span className="font-semibold text-teal-600">"{searchQuery}"</span>
          </p>
        </div>
      )}

      {/* ── Kanban / Grid ── */}
      {statusFilter === 'all' && !isSearching ? (
        // Kanban — columns grow naturally, page scrolls
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map(config => (
            <KanbanColumn
              key={config.status}
              config={config}
              shipments={filteredByStatus[config.status]}
              onAction={actions}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <>
          {!isSearching && statusFilter !== 'all' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{filtered.length}</span>{' '}
              {activeColConfig?.label.toLowerCase()} shipments
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center py-20 gap-2">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                {isSearching ? 'No shipments match your search' : `No ${activeColConfig?.label.toLowerCase()} shipments`}
              </p>
              <p className="text-sm text-gray-400">
                {isSearching ? 'Try different keywords or clear the search' : 'Try a different filter or create a new shipment'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.filter(s => s?._id).map(shipment => (
                <ShipmentCard
                  key={shipment._id}
                  shipment={shipment}
                  isAdmin={isAdmin}
                  onViewDetails={setDetailShipment}
                  onAssign={() => openAssign(shipment)}
                  onAssignManager={() => openManager(shipment)}
                  onCancel={() => handleCancel(shipment._id)}
                  isArchivedView={archivedFilter === 'archived'}
                  onArchive={() => handleArchive(shipment._id)}
                  onUnarchive={() => handleUnarchive(shipment._id)}
                  onEdit={() => handleEdit(shipment)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showAssignModal && selectedShipment && (
        <AssignShipmentModal
          shipment={selectedShipment}
          trucks={trucks}
          drivers={drivers}
          onClose={closeAssign}
          onAssign={(shipmentId, truckId, driverId) => assignMutation.mutateAsync({ shipmentId, truckId, driverId })}
          onReassign={handleReassign}
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
          onEdit={() => { handleEdit(detailShipment); setDetailShipment(null); }}
          onArchive={(id) => { handleArchive(id); setDetailShipment(null); }}
          onUnarchive={(id) => { handleUnarchive(id); setDetailShipment(null); }}
        />
      )}
    </div>
  );
};

export default Shipments;