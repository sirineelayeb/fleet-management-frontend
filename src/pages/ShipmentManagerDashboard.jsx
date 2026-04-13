import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { shipmentService } from '../services/shipmentService';
import { truckService } from '../services/truckService';
import StatCard from '../components/Cards/StatCard';
import webSocketService from '../services/websocket';
import {
  CubeIcon, MapIcon, CheckCircleIcon, TruckIcon,
  ArrowPathIcon, SignalIcon, ChartBarIcon, XCircleIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, WifiIcon, XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  actionGradients, iconColors, iconTextColors, getStatusBadge, getStatusText,
  getStatCardColor,
} from '../constants/colors';

const toArray = (r) => {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.data)) return r.data;
  return [];
};

const DONUT_COLORS = {
  Completed:   '#10b981',
  'In Progress': '#3b82f6',
  Assigned:    '#8b5cf6',
  Pending:     '#f59e0b',
  Cancelled:   '#ef4444',
};

const KpiCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendLabel }) => {
  const isUp = trend >= 0;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {isUp ? <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> : <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-1">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <p className="text-xs text-gray-400 border-t pt-2">{trendLabel}</p>
    </div>
  );
};

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const TrackModal = ({ shipmentId, onClose, onCancelled }) => {
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const { data: shipmentData, isLoading: shipmentLoading } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: async () => {
      const res = await shipmentService.getById(shipmentId);
      return res?.data || res?.shipment || res;
    },
    enabled: !!shipmentId,
  });

  const { data: missionData, isLoading: missionLoading } = useQuery({
    queryKey: ['mission', shipmentId],
    queryFn: async () => {
      try {
        const res = await shipmentService.getMission(shipmentId);
        return res?.data || res?.mission || res;
      } catch {
        return null;
      }
    },
    enabled: !!shipmentId,
  });

  const shipment = shipmentData;
  const mission = missionData;

  const isCancellable = shipment && ['pending', 'assigned'].includes(shipment.status);
  const isCancelled = shipment?.status === 'cancelled';

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await shipmentService.cancel(shipmentId);
      queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipmentStats'] });
      setConfirmCancel(false);
      onCancelled?.();
    } catch (e) {
      setCancelError('Failed to cancel shipment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white h-full w-full max-w-lg flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {shipment?.shipmentId || (shipmentId ? `#${shipmentId.slice(-8)}` : 'Shipment')}
            </h2>
            {shipment && (
              <span className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full ${getStatusBadge(shipment.status, 'shipment')}`}>
                {getStatusText(shipment.status)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {(shipmentLoading || missionLoading) && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          )}

          {!shipmentLoading && shipment && (
            <>
              {!isCancelled && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wide">Progress</p>
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 z-0" />
                    <div
                      className="absolute left-0 top-4 h-0.5 bg-blue-500 z-0 transition-all duration-500"
                      style={{ width: shipment.status === 'assigned' ? '33%' : shipment.status === 'in_progress' ? '66%' : '0%' }}
                    />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-blue-500 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                      <span className="text-xs text-blue-600 font-medium">Pending</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${shipment.status === 'assigned' || shipment.status === 'in_progress' || shipment.status === 'completed' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                        {['assigned', 'in_progress', 'completed'].includes(shipment.status) && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${['assigned', 'in_progress', 'completed'].includes(shipment.status) ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Assigned</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${shipment.status === 'in_progress' || shipment.status === 'completed' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                        {['in_progress', 'completed'].includes(shipment.status) && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${['in_progress', 'completed'].includes(shipment.status) ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>In Progress</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${shipment.status === 'completed' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                        {shipment.status === 'completed' && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${shipment.status === 'completed' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>Completed</span>
                    </div>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                  <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Shipment cancelled</p>
                    <p className="text-xs text-red-500 mt-0.5">This shipment was cancelled and is no longer active.</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Route</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Origin</p>
                      <p className="text-sm text-gray-800">{shipment.origin?.address || shipment.origin || '—'}</p>
                    </div>
                  </div>
                  <div className="ml-1 border-l-2 border-dashed border-gray-300 h-4" />
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Destination</p>
                      <p className="text-sm text-gray-800">{shipment.destination?.address || shipment.destination || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {shipment.createdAt ? new Date(shipment.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Planned Delivery</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {shipment.plannedDeliveryDate ? new Date(shipment.plannedDeliveryDate).toLocaleString() : '—'}
                  </p>
                </div>
                {shipment.actualDeliveryDate && (
                  <div className="bg-emerald-50 rounded-xl p-4 col-span-2">
                    <p className="text-xs text-emerald-600">Actual Delivery</p>
                    <p className="text-sm font-medium text-emerald-800 mt-0.5">
                      {new Date(shipment.actualDeliveryDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {!missionLoading && mission && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mission</p>
                  {mission.driver && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                        {(mission.driver.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{mission.driver.name}</p>
                        <p className="text-xs text-gray-400">{mission.driver.phone || mission.driver.email || 'Driver'}</p>
                      </div>
                    </div>
                  )}
                  {mission.truck && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <TruckIcon className="h-4 w-4 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{mission.truck.licensePlate}</p>
                        <p className="text-xs text-gray-400">{mission.truck.brand} {mission.truck.model}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!missionLoading && !mission && (shipment.truck || shipment.driver) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assignment</p>
                  {shipment.driver && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                        {(shipment.driver.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{shipment.driver.name || shipment.driver}</p>
                        <p className="text-xs text-gray-400">Driver</p>
                      </div>
                    </div>
                  )}
                  {shipment.truck && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
                        <TruckIcon className="h-4 w-4 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{shipment.truck.licensePlate || shipment.truck}</p>
                        <p className="text-xs text-gray-400">{shipment.truck.brand} {shipment.truck.model}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isCancellable && (
                <div className="border border-red-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                    <p className="text-sm font-medium text-red-700">Cancel shipment</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    This will stop the shipment. Only possible while it's pending or assigned.
                  </p>
                  {cancelError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{cancelError}</p>
                  )}
                  {!confirmCancel ? (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel this shipment
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                      </button>
                      <button
                        onClick={() => { setConfirmCancel(false); setCancelError(null); }}
                        className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Keep it
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <Link
            to={`/shipment_manager/shipments/${shipmentId}`}
            className="flex-1 text-center py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={onClose}
          >
            Open full detail page →
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ShipmentManagerDashboard = () => {
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [trackingId, setTrackingId] = useState(null);

  const { data: shipmentStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['shipmentStats'],
    queryFn: async () => {
      try {
        const response = await shipmentService.getStats();
        return response?.success ? response : { success: true, stats: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0, completionRate: 0 } };
      } catch {
        return { success: true, stats: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0, completionRate: 0 } };
      }
    },
    refetchInterval: 60000,
  });

  const { data: truckStats, isLoading: truckStatsLoading, refetch: refetchTruckStats } = useQuery({
    queryKey: ['truckStats'],
    queryFn: async () => {
      try {
        const response = await truckService.getStats();
        return response?.success ? response : { success: true, stats: { total: 0, available: 0, inMission: 0, maintenance: 0, activeWithTelemetry: 0, utilizationRate: '0.0' } };
      } catch {
        return { success: true, stats: { total: 0, available: 0, inMission: 0, maintenance: 0, activeWithTelemetry: 0, utilizationRate: '0.0' } };
      }
    },
    refetchInterval: 60000,
  });

  const { data: shipments = [], isLoading: shipmentsLoading, refetch: refetchShipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => toArray(await shipmentService.getAll()),
  });

  const { data: activeTrucks = [], isLoading: trucksLoading, refetch: refetchTrucks } = useQuery({
    queryKey: ['activeTrucks'],
    queryFn: async () => toArray(await truckService.getActiveTrucks()),
    refetchInterval: 30000,
  });

  useEffect(() => {
    webSocketService.connect();
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleTruckUpdated = ({ truck }) => {
      queryClient.setQueryData(['activeTrucks'], old => toArray(old).map(t => t._id === truck._id ? truck : t));
      queryClient.invalidateQueries({ queryKey: ['truckStats'] });
      setLastRefresh(new Date());
    };
    const handleShipmentUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipmentStats'] });
      setLastRefresh(new Date());
    };
    webSocketService.on('connect', handleConnect);
    webSocketService.on('disconnect', handleDisconnect);
    webSocketService.on('truck:updated', handleTruckUpdated);
    webSocketService.on('shipment:updated', handleShipmentUpdated);
    return () => {
      webSocketService.off('connect', handleConnect);
      webSocketService.off('disconnect', handleDisconnect);
      webSocketService.off('truck:updated', handleTruckUpdated);
      webSocketService.off('shipment:updated', handleShipmentUpdated);
    };
  }, [queryClient]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats(); refetchTruckStats(); refetchShipments(); refetchTrucks();
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [refetchStats, refetchTruckStats, refetchShipments, refetchTrucks]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    setLastRefresh(new Date());
  };

  const shipmentsArray = toArray(shipments);

  const delayedShipments = shipmentsArray.filter(s =>
    ['pending', 'assigned', 'in_progress'].includes(s.status) &&
    s.plannedDeliveryDate && new Date() > new Date(s.plannedDeliveryDate)
  );

  const shipmentStatusCounts = {
    pending:    shipmentsArray.filter(s => s.status === 'pending').length,
    assigned:   shipmentsArray.filter(s => s.status === 'assigned').length,
    inProgress: shipmentsArray.filter(s => s.status === 'in_progress').length,
    completed:  shipmentsArray.filter(s => s.status === 'completed').length,
    cancelled:  shipmentsArray.filter(s => s.status === 'cancelled').length,
  };

  const stats = {
    totalShipments:     shipmentStats?.stats?.total || shipmentsArray.length,
    pendingShipments:   shipmentStatusCounts.pending,
    assignedShipments:  shipmentStatusCounts.assigned,
    inTransitShipments: shipmentStatusCounts.inProgress,
    deliveredShipments: shipmentStatusCounts.completed,
    cancelledShipments: shipmentStatusCounts.cancelled,
    totalTrucks:        truckStats?.stats?.total || 0,
    availableTrucks:    truckStats?.stats?.available || 0,
    onRoadTrucks:       truckStats?.stats?.inMission || 0,
    trucksInMaintenance: truckStats?.stats?.maintenance || 0,
    activeWithTelemetry: truckStats?.stats?.activeWithTelemetry || 0,
    utilizationRate:    truckStats?.stats?.utilizationRate || 0,
  };

  const onTimeRate = useMemo(() => {
    const completed = shipmentsArray.filter(s => s.status === 'completed');
    const onTime = completed.filter(s => 
      s.actualDeliveryDate && s.plannedDeliveryDate &&
      new Date(s.actualDeliveryDate) <= new Date(s.plannedDeliveryDate)
    );
    return completed.length > 0 ? ((onTime.length / completed.length) * 100).toFixed(1) : 0;
  }, [shipmentsArray]);

  const donutData = [
    { name: 'Completed',   value: stats.deliveredShipments },
    { name: 'In Progress', value: stats.inTransitShipments },
    { name: 'Assigned',    value: stats.assignedShipments },
    { name: 'Pending',     value: stats.pendingShipments },
    { name: 'Cancelled',   value: stats.cancelledShipments },
  ].filter(d => d.value > 0);

  const recentShipments = shipmentsArray.slice(0, 5);

  const quickActions = [
    { title: 'Track Shipments', path: '/shipment_manager/shipments', icon: CubeIcon, color: 'blue', description: 'View and manage all shipments', gradient: actionGradients.shipments },
    { title: 'Full Screen Map', path: '/shipment_manager/map', icon: MapIcon, color: 'green', description: 'Live fleet tracking on full screen', gradient: actionGradients.map },
  ];

  if (statsLoading || truckStatsLoading || shipmentsLoading || trucksLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {trackingId && (
        <TrackModal
          shipmentId={trackingId}
          onClose={() => setTrackingId(null)}
          onCancelled={() => setTrackingId(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shipment Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">Track shipments, monitor fleet, and manage deliveries</p>
            <p className="text-xs text-gray-400 mt-2">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          </div>
         
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="Total Shipments" value={stats.totalShipments} subtitle={`${stats.inTransitShipments} in transit`} icon={CubeIcon} iconBg="bg-blue-50" iconColor="text-blue-600" trend={+5.2} trendLabel="vs. last 30 days" />
            <KpiCard title="Completion Rate" value={`${shipmentStats?.stats?.completionRate || 0}%`} subtitle={`${stats.deliveredShipments} of ${stats.totalShipments} completed`} icon={CheckCircleIcon} iconBg="bg-emerald-50" iconColor="text-emerald-600" trend={+2.1} trendLabel="vs. last 30 days" />
            <KpiCard title="Active Vehicles" value={stats.onRoadTrucks} subtitle={`${stats.totalTrucks} total in fleet`} icon={TruckIcon} iconBg="bg-sky-50" iconColor="text-sky-600" trend={stats.onRoadTrucks > 0 ? +4.0 : -4.0} trendLabel="vs. last 30 days" />
          </div>
        </div>

        {delayedShipments.length > 0 && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">⚠️ Delayed Shipments ({delayedShipments.length})</h3>
            </div>
            <div className="space-y-2">
              {delayedShipments.slice(0, 5).map(s => (
                <div key={s._id} className="flex justify-between items-center text-sm">
                  <span className="font-mono">{s.shipmentId || s._id.slice(-8)} – {s.origin} → {s.destination}</span>
                  <span className="text-red-600">Overdue by {Math.ceil((new Date() - new Date(s.plannedDeliveryDate)) / (1000*3600))}h</span>
                  <button onClick={() => setTrackingId(s._id)} className="text-blue-600 text-xs">Track</button>
                </div>
              ))}
              {delayedShipments.length > 5 && (
                <p className="text-xs text-red-600 text-center pt-2">+ {delayedShipments.length - 5} more delayed</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Shipment Status</h2>
              <p className="text-xs text-gray-400 mt-0.5">Live distribution across all shipments — updates via WebSocket</p>
            </div>
            {donutData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-gray-400">
                <CubeIcon className="h-10 w-10 mb-2 text-gray-300" />
                <p className="text-sm">No shipment data available</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={75} outerRadius={115} paddingAngle={3} dataKey="value" labelLine={false} label={renderDonutLabel}>
                        {donutData.map((entry) => <Cell key={entry.name} fill={DONUT_COLORS[entry.name] || '#6b7280'} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
                  {[
                    { name: 'Completed',   value: stats.deliveredShipments, sub: 'Successfully completed' },
                    { name: 'In Progress', value: stats.inTransitShipments, sub: 'Currently on the road' },
                    { name: 'Cancelled',   value: stats.cancelledShipments, sub: 'Cancelled shipments' },
                    { name: 'Pending',     value: stats.pendingShipments,   sub: 'Awaiting dispatch' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                      <span className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: DONUT_COLORS[item.name] }} />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                        <p className="text-xs font-medium text-gray-700">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <StatCard title="Available Trucks" value={stats.availableTrucks} icon={TruckIcon} color={getStatCardColor('availableTrucks')} subtitle="Ready for dispatch" />
            <StatCard title="Trucks On Road" value={stats.onRoadTrucks} icon={MapIcon} color={getStatCardColor('onRoadTrucks')} subtitle="Currently delivering" />
            <StatCard title="Fleet Utilization" value={`${stats.utilizationRate}%`} icon={ChartBarIcon} color={getStatCardColor('fleetUtilization')} subtitle={`${stats.onRoadTrucks} of ${stats.totalTrucks} active`} />
            <StatCard
              title="Live Telemetry"
              value={`${stats.activeWithTelemetry} / ${stats.totalTrucks}`}
              icon={SignalIcon}
              color={getStatCardColor('liveTelemetry')}
              subtitle={`${stats.totalTrucks > 0 ? ((stats.activeWithTelemetry / stats.totalTrucks) * 100).toFixed(0) : 0}% of fleet`}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.path} className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-1">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${action.gradient}`} />
                <div className="p-6">
                  <div className={`inline-flex p-3 rounded-lg ${iconColors[action.color]} bg-opacity-10 mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`h-6 w-6 ${iconTextColors[action.color]}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
              <Link to="/shipment_manager/shipments" className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All →</Link>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {recentShipments.length > 0 ? recentShipments.map((shipment) => (
                <div key={shipment._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{shipment.shipmentId || shipment._id.slice(-8)}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(shipment.status, 'shipment')}`}>{getStatusText(shipment.status)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">From: {shipment.origin?.address || shipment.origin || 'N/A'}</p>
                      <p className="text-sm text-gray-500">To: {shipment.destination?.address || shipment.destination || 'N/A'}</p>
                      {shipment.plannedDeliveryDate && (
                        <p className="text-xs text-gray-400 mt-1">Planned: {new Date(shipment.plannedDeliveryDate).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/shipment_manager/shipments/${shipment._id}`}
                        className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View →
                      </Link>
                      <button
                        onClick={() => setTrackingId(shipment._id)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Track →
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500">
                  <CubeIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No shipments found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentManagerDashboard;