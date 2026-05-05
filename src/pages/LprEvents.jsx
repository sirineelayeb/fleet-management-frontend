import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lprService } from '../services/lprService';
import { usePagination } from '../hooks/usePagination';
import PaginationComponent from '../components/Common/Pagination';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatCard from '../components/Cards/StatCard';
import Modal from '../components/Common/Modal';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon, ArrowUpCircleIcon, ArrowDownCircleIcon,
  CheckCircleIcon, XCircleIcon, CameraIcon, ClockIcon,
  ShieldCheckIcon, FunnelIcon, TrashIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
// ── Badges ────────────────────────────────────────────────────

const DirectionBadge = ({ direction }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
    ${direction === 'entry'
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700'}`}>
    {direction === 'entry'
      ? <ArrowDownCircleIcon className="h-3.5 w-3.5" />
      : <ArrowUpCircleIcon  className="h-3.5 w-3.5" />}
    {direction === 'entry' ? 'Entry' : 'Exit'}
  </span>
);

const AuthBadge = ({ isAuthorized }) => {
  const map = {
    true:  { label: 'Authorized',   cls: 'bg-blue-100 text-blue-700',  icon: <CheckCircleIcon className="h-3.5 w-3.5" /> },
    false: { label: 'Unauthorized', cls: 'bg-red-100 text-red-700',    icon: <XCircleIcon     className="h-3.5 w-3.5" /> },
    null:  { label: 'Unknown',      cls: 'bg-gray-100 text-gray-500',  icon: <ClockIcon       className="h-3.5 w-3.5" /> },
  };
  const s = map[String(isAuthorized)] ?? map['null'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
};

const EntryStatusBadge = ({ status, minutes }) => {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const map = {
    on_time: { label: 'On Time', cls: 'bg-green-100 text-green-700' },
    late:    { label: 'Late',    cls: 'bg-red-100 text-red-700'     },
    early:   { label: 'Early',   cls: 'bg-yellow-100 text-yellow-700' },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <div>
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
        {s.label}
      </span>
      {minutes !== null && minutes !== undefined && (
        <p className="text-xs text-gray-400 mt-0.5">
          {minutes > 0 ? `${minutes}min late` : minutes < 0 ? `${Math.abs(minutes)}min early` : 'on time'}
        </p>
      )}
    </div>
  );
};

const ConfidenceBar = ({ value }) => {
  const pct   = Math.round((value ?? 1) * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────

const fmt = (d) => d
  ? new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  : '—';

// ── Detail Modal ──────────────────────────────────────────────

const EventDetailModal = ({ event }) => {
  if (!event) return null;

  const Row = ({ label, children }) => (
    <div>
      <p className="text-gray-400 text-xs uppercase font-semibold mb-1">{label}</p>
      {children}
    </div>
  );

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <Row label="Plate">
          <p className="font-bold text-lg text-gray-900">{event.plateNumber}</p>
        </Row>
        <Row label="Direction"><DirectionBadge direction={event.direction} /></Row>
        <Row label="Authorization"><AuthBadge isAuthorized={event.isAuthorized} /></Row>
        <Row label="Entry Status">
          <EntryStatusBadge status={event.entryStatus} minutes={event.minutesFromPlanned} />
        </Row>
        <Row label="Source"><span className="capitalize">{event.source || '—'}</span></Row>
        <Row label="Camera"><p>{event.cameraId || '—'}</p></Row>
        <Row label="Confidence"><ConfidenceBar value={event.confidence} /></Row>
        <Row label="Timestamp"><p>{fmt(event.createdAt)}</p></Row>
        <Row label="Loading Zone">
          {event.loadingZone
            ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                📍 {event.loadingZone.name}
              </span>
            : <span className="text-gray-400 italic">Not assigned</span>}
        </Row>
      </div>

      {event.truck && (
        <div className="border-t pt-4">
          <p className="text-gray-400 text-xs uppercase font-semibold mb-2">Truck</p>
          <p className="font-medium">{event.truck.licensePlate}</p>
          <p className="text-gray-500">{event.truck.brand} {event.truck.model}</p>
        </div>
      )}

      {event.matchedShipment && (
        <div className="border-t pt-4">
          <p className="text-gray-400 text-xs uppercase font-semibold mb-2">Matched Shipment</p>
          <p className="font-medium text-blue-600">{event.matchedShipment.shipmentId}</p>
          <p className="text-gray-500 text-xs mt-1">Planned departure: {fmt(event.matchedShipment.plannedDepartureDate)}</p>
          <p className="text-gray-500 text-xs capitalize">Status: {event.matchedShipment.status}</p>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────

const TABLE_HEADERS = [
  'Timestamp', 'Plate', 'Direction', 'Truck',
  'Shipment', 'Entry Status', 'Confidence', 'Authorization', 'Actions'
];

const LprEvents = () => {
  const { isAdmin } = useAuth();
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 5);
  const [filters, setFilters]       = useState({ plate: '', direction: '', from: '', to: '' });
  const [searchInput, setSearchInput] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const queryClient = useQueryClient();

  // ── Real-time updates via socket ──
  useEffect(() => {
    const socket = window.__socket; // adjust to however you access socket
    if (!socket) return;

    const refresh = (n) => {
      const lprTypes = ['truck_entry_authorized', 'truck_entry_late', 'access_denied'];
      if (lprTypes.includes(n.type)) {
        queryClient.invalidateQueries(['lpr-events']);
        queryClient.invalidateQueries(['lpr-stats']);
      }
    };

    socket.on('new_notification', refresh);
    return () => socket.off('new_notification', refresh);
  }, [queryClient]);

  // ── Queries ──
  const { data: statsData } = useQuery({
    queryKey: ['lpr-stats'],
    queryFn:  lprService.getStats,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: eventsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lpr-events', page, limit, filters],
    queryFn:  () => lprService.getEvents({
      page, limit,
      plate:     filters.plate     || undefined,
      direction: filters.direction || undefined,
      from:      filters.from      || undefined,
      to:        filters.to        || undefined,
    }),
    keepPreviousData: true,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id) => lprService.deleteEvent(id),
    onSuccess: () => {
      toast.success('Event deleted');
      queryClient.invalidateQueries(['lpr-events']);
      queryClient.invalidateQueries(['lpr-stats']);
      setEventToDelete(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const events     = eventsData?.data || [];
  const stats      = statsData?.stats || {};
  const totalPages = Math.ceil((eventsData?.total || 0) / limit);

  const handleSearch = () => { setFilters(f => ({ ...f, plate: searchInput })); setPage(1); };
  const clearFilters = () => { setFilters({ plate: '', direction: '', from: '', to: '' }); setSearchInput(''); setPage(1); };
  const hasFilters   = filters.plate || filters.direction || filters.from || filters.to;

  if (isLoading && !eventsData) {
    return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
                  <CameraIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">
                  Loading LPR Events...
                </p>
              </div>
              );
            }   

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LPR Event Logs</h1>
          <p className="text-gray-500 mt-1">Track all gate entry and exit events</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100">
          <CameraIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Events"  value={stats.totalEvents  ?? 0} icon={ClockIcon}          color="purple" subtitle="All time" />
        <StatCard title="Entries"       value={stats.entries      ?? 0} icon={ArrowDownCircleIcon} color="green"  subtitle="Vehicles entered" />
        <StatCard title="Exits"         value={stats.exits        ?? 0} icon={ArrowUpCircleIcon}   color="blue"   subtitle="Vehicles exited" />
        <StatCard title="Unauthorized"  value={stats.unauthorized ?? 0} icon={ShieldCheckIcon}     color="red"    subtitle="Blocked detections" />
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search plate..."
          className="flex-1 min-w-[180px] px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <select className="px-4 py-2 border rounded-lg text-sm"
          value={filters.direction}
          onChange={e => { setFilters(f => ({ ...f, direction: e.target.value })); setPage(1); }}>
          <option value="">All Directions</option>
          <option value="entry">Entry</option>
          <option value="exit">Exit</option>
        </select>
        <input type="datetime-local" className="px-4 py-2 border rounded-lg text-sm"
          value={filters.from}
          onChange={e => { setFilters(f => ({ ...f, from: e.target.value })); setPage(1); }} />
        <input type="datetime-local" className="px-4 py-2 border rounded-lg text-sm"
          value={filters.to}
          onChange={e => { setFilters(f => ({ ...f, to: e.target.value })); setPage(1); }} />
        <button onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
          <MagnifyingGlassIcon className="h-4 w-4" /> Search
        </button>
        {hasFilters && (
          <button onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2 text-sm">
            <FunnelIcon className="h-4 w-4" /> Clear
          </button>
        )}
        {isFetching && (
          <div className="w-full mt-1 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            Refreshing...
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {TABLE_HEADERS.map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.length === 0 ? (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-6 py-16 text-center text-gray-400">
                  <CameraIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No events found
                </td>
              </tr>
            ) : events.map(event => (
              <tr key={event._id}
                className={`hover:bg-gray-50 transition-colors ${event.isAuthorized === false ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(event.createdAt)}</td>
                <td className="px-4 py-3 font-mono font-semibold text-sm">{event.plateNumber}</td>
                <td className="px-4 py-3"><DirectionBadge direction={event.direction} /></td>
                <td className="px-4 py-3 text-sm">
                  {event.truck
                    ? <div>
                        <p className="font-medium">{event.truck.licensePlate}</p>
                        <p className="text-xs text-gray-400">{event.truck.brand} {event.truck.model}</p>
                      </div>
                    : <span className="text-gray-400 text-xs">Not registered</span>}
                </td>
                <td className="px-4 py-3 text-sm">
                  {event.matchedShipment
                    ? <div>
                        <p className="font-medium text-blue-700">{event.matchedShipment.shipmentId}</p>
                        <p className="text-xs text-gray-400 capitalize">{event.matchedShipment.status}</p>
                      </div>
                    : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  <EntryStatusBadge status={event.entryStatus} minutes={event.minutesFromPlanned} />
                </td>
                <td className="px-4 py-3"><ConfidenceBar value={event.confidence} /></td>
                <td className="px-4 py-3"><AuthBadge isAuthorized={event.isAuthorized} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedEvent(event)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline">
                      View
                    </button>
                    {/* Only admins see the delete button */}
                    {isAdmin && (
                      <button onClick={() => setEventToDelete(event)}
                        className="text-red-500 hover:text-red-700">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <PaginationComponent
          currentPage={eventsData?.page || 1}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={handleLimitChange}
          pageSize={limit}
          totalItems={eventsData?.total || 0}
          showFirstLast showPageSizeSelector
          siblingCount={1}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)}
        title={`Event — ${selectedEvent?.plateNumber}`} size="md">
        <EventDetailModal event={selectedEvent} />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!eventToDelete} onClose={() => setEventToDelete(null)}
        title="Delete Event" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <p className="font-semibold">This action cannot be undone</p>
          </div>
          <p className="text-sm text-gray-600">
            Delete event for <span className="font-bold">{eventToDelete?.plateNumber}</span> from {fmt(eventToDelete?.createdAt)}?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEventToDelete(null)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button onClick={() => deleteMutation.mutate(eventToDelete._id)}
              disabled={deleteMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default LprEvents;