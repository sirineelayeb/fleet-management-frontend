import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { shipmentService } from '../services/shipmentService';
import { truckService } from '../services/truckService';
import StatCard from '../components/Cards/StatCard';
import webSocketService from '../services/websocket';
import {
  CubeIcon, MapIcon, CheckCircleIcon, TruckIcon,
  ChartBarIcon, ExclamationTriangleIcon,
  ArrowPathIcon, CalendarIcon, ClockIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import { getStatusBadge, getStatusText } from '../constants/colors';

// ============================================
// BRAND COLORS
// ============================================
const COLORS = {
  orange: '#F29F67',
  navy:   '#1E1E2C',
  gold:   '#E0B50F',
  teal:   '#34B1AA',
  blue:   '#3B8FF3',
};

// ============================================
// UTILITIES
// ============================================

const toArray = (r) => {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.data)) return r.data;
  return [];
};

const pct = (v, t) => (t > 0 ? parseFloat(((v / t) * 100).toFixed(1)) : 0);

const DONUT_COLORS = {
  Completed:     COLORS.teal,
  'In Progress': COLORS.blue,
  Assigned:      COLORS.gold,
  Pending:       COLORS.orange,
  Cancelled:     '#9ca3af',
};

// ============================================
// SHARED UI
// ============================================

const EmptyChart = ({ icon: Icon, message, height = 240 }) => (
  <div className="flex flex-col items-center justify-center text-gray-400" style={{ height }}>
    <Icon className="h-10 w-10 mb-2 text-gray-300" />
    <p className="text-sm font-medium text-gray-400">{message}</p>
    <p className="text-xs text-gray-300 mt-1">Data will appear here once available</p>
  </div>
);

// ============================================
// CHART COMPONENTS
// ============================================

const ShipmentDonutChart = ({ donutData }) => {
  if (donutData.length === 0) {
    return <EmptyChart icon={CubeIcon} message="No shipment data available" />;
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-full lg:w-1/2">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%" cy="50%"
              innerRadius={60} outerRadius={90}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {donutData.map((entry) => (
                <Cell key={entry.name} fill={DONUT_COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full lg:w-1/2 space-y-2">
        {donutData.map((item) => (
          <div key={item.name} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[item.name] }} />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VehicleBarChart = ({ vehicleData }) => {
  if (vehicleData.length === 0) {
    return <EmptyChart icon={TruckIcon} message="No vehicle data available" height={260} />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={vehicleData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [`${value} vehicles`, 'Count']} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
          {vehicleData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const WeeklyTrendChart = ({ shipments }) => {
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((name, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (3 - i) * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const inWeek = shipments.filter(s => {
        const created = s.createdAt ? new Date(s.createdAt) : null;
        return created && created >= weekStart && created < weekEnd;
      });

      return {
        name,
        shipments: inWeek.length,
        completed: inWeek.filter(s => s.status === 'completed').length,
      };
    });
  }, [shipments]);

  const hasData = weeklyTrend.some(w => w.shipments > 0);

  if (!hasData) {
    return <EmptyChart icon={ChartBarIcon} message="No weekly shipment data yet" height={260} />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={weeklyTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="shipments" stroke={COLORS.blue}   strokeWidth={2} name="Total Shipments" />
        <Line type="monotone" dataKey="completed"  stroke={COLORS.teal}  strokeWidth={2} name="Completed" />
      </LineChart>
    </ResponsiveContainer>
  );
};

const PerformanceBars = ({ onTimeRate, utilizationRate, completionRate }) => {
  const metrics = [
    { label: 'On-Time Delivery',  value: onTimeRate,      color: COLORS.teal,   textColor: COLORS.teal   },
    { label: 'Fleet Utilization', value: utilizationRate, color: COLORS.blue,   textColor: COLORS.blue   },
    { label: 'Completion Rate',   value: completionRate,  color: COLORS.orange, textColor: COLORS.orange },
  ];

  return (
    <div className="space-y-6">
      {metrics.map(({ label, value, color, textColor }) => (
        <div key={label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold" style={{ color: textColor }}>{value}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="rounded-full h-2 transition-all"
              style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ShipmentManagerDashboard = () => {
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Queries ──────────────────────────────────────────────
  const { data: shipmentStats, refetch: refetchStats } = useQuery({
    queryKey: ['shipmentStats'],
    queryFn: async () => {
      try {
        const r = await shipmentService.getStats();
        return r?.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
      } catch {
        return { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
      }
    },
    refetchInterval: 60000,
  });

  const { data: truckStats } = useQuery({
    queryKey: ['truckStats'],
    queryFn: async () => {
      try {
        const r = await truckService.getStats();
        return r?.stats || { total: 0, available: 0, inMission: 0, maintenance: 0, utilizationRate: '0' };
      } catch {
        return { total: 0, available: 0, inMission: 0, maintenance: 0, utilizationRate: '0' };
      }
    },
    refetchInterval: 60000,
  });

  const { data: rawShipments = [], refetch: refetchShipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => toArray(await shipmentService.getAll()),
  });

  const shipments = toArray(rawShipments);

  // ── WebSocket listeners ──────────────────────────────────
  useEffect(() => {
    const handleShipmentUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipmentStats'] });
      setLastRefresh(new Date());
    };
    const handleTruckUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['truckStats'] });
      setLastRefresh(new Date());
    };

    webSocketService.on('shipment:updated', handleShipmentUpdated);
    webSocketService.on('truck:updated', handleTruckUpdated);
    return () => {
      webSocketService.off('shipment:updated', handleShipmentUpdated);
      webSocketService.off('truck:updated', handleTruckUpdated);
    };
  }, [queryClient]);

  // ── Auto-refresh ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchShipments();
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [refetchStats, refetchShipments]);

  // ── Derived stats ────────────────────────────────────────
  const stats = useMemo(() => ({
    totalShipments:     shipmentStats?.total       || shipments.length,
    pendingShipments:   shipments.filter(s => s.status === 'pending').length,
    assignedShipments:  shipments.filter(s => s.status === 'assigned').length,
    inTransitShipments: shipments.filter(s => s.status === 'in_progress').length,
    deliveredShipments: shipments.filter(s => s.status === 'completed').length,
    cancelledShipments: shipments.filter(s => s.status === 'cancelled').length,
    totalTrucks:        truckStats?.total          || 0,
    availableTrucks:    truckStats?.available      || 0,
    onRoadTrucks:       truckStats?.inMission      || 0,
    maintenanceTrucks:  truckStats?.maintenance    || 0,
    utilizationRate:    truckStats?.utilizationRate || 0,
  }), [shipments, shipmentStats, truckStats]);

  const onTimeRate = useMemo(() => {
    const completed = shipments.filter(s => s.status === 'completed');
    const onTime = completed.filter(
      s => s.actualDeliveryDate && s.plannedDeliveryDate &&
           new Date(s.actualDeliveryDate) <= new Date(s.plannedDeliveryDate)
    );
    return pct(onTime.length, completed.length);
  }, [shipments]);

  const completionRate = pct(stats.deliveredShipments, stats.totalShipments);

  const avgCompletionTime = useMemo(() => {
    const completed = shipments.filter(
      s => s.status === 'completed' && s.createdAt && s.actualDeliveryDate
    );
    if (completed.length === 0) return null;
    const totalDays = completed.reduce((sum, s) => {
      const diff = new Date(s.actualDeliveryDate) - new Date(s.createdAt);
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return (totalDays / completed.length).toFixed(1);
  }, [shipments]);

  const delayedShipments = shipments.filter(s =>
    ['pending', 'assigned', 'in_progress'].includes(s.status) &&
    s.plannedDeliveryDate && new Date() > new Date(s.plannedDeliveryDate)
  );

  // ── Chart data ───────────────────────────────────────────
  const donutData = [
    { name: 'Completed',   value: stats.deliveredShipments  },
    { name: 'In Progress', value: stats.inTransitShipments  },
    { name: 'Assigned',    value: stats.assignedShipments   },
    { name: 'Pending',     value: stats.pendingShipments    },
    { name: 'Cancelled',   value: stats.cancelledShipments  },
  ].filter(d => d.value > 0);

  const vehicleData = [
    { name: 'Available',   value: stats.availableTrucks,   color: COLORS.teal   },
    { name: 'In Mission',  value: stats.onRoadTrucks,      color: COLORS.blue   },
    { name: 'Maintenance', value: stats.maintenanceTrucks, color: COLORS.orange },
  ].filter(v => v.value > 0);

  const recentShipments = shipments.slice(0, 5);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    setLastRefresh(new Date());
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.navy }}>
              Shipment Manager Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Track shipments and monitor fleet performance</p>
            <p className="text-xs text-gray-400 mt-2">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* KPI Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Shipments"
            value={stats.totalShipments || '—'}
            icon={CubeIcon} color="blue"
            subtitle={`${stats.inTransitShipments} in transit`}
          />
          <StatCard
            title="Completion Rate"
            value={stats.totalShipments === 0 ? '—' : `${completionRate}%`}
            icon={CheckCircleIcon} color="teal"
            subtitle={`${stats.deliveredShipments} of ${stats.totalShipments} completed`}
          />
          <StatCard
            title="Active Vehicles"
            value={stats.totalTrucks === 0 ? '—' : stats.onRoadTrucks}
            icon={TruckIcon} color="blue"
            subtitle={`${stats.totalTrucks} total in fleet`}
          />
          <StatCard
            title="Fleet Utilization"
            value={stats.totalTrucks === 0 ? '—' : `${stats.utilizationRate}%`}
            icon={ChartBarIcon} color="orange"
            subtitle={`${stats.onRoadTrucks} of ${stats.totalTrucks} active`}
          />
        </div>

        {/* KPI Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="On-Time Delivery"
            value={stats.deliveredShipments === 0 ? '—' : `${onTimeRate}%`}
            icon={ClockIcon} color="teal"
            subtitle="Delivered on schedule"
          />
          <StatCard
            title="Pending Shipments"
            value={stats.pendingShipments}
            icon={CalendarIcon} color="gold"
            subtitle="Awaiting assignment"
          />
          <StatCard
            title="Avg Completion Time"
            value={avgCompletionTime ? `${avgCompletionTime}d` : '—'}
            icon={ArrowTrendingUpIcon} color="navy"
            subtitle="Based on completed shipments"
          />
        </div>

        {/* Delayed Shipments Alert */}
        {delayedShipments.length > 0 && (
          <div
            className="mb-8 p-4 rounded-xl"
            style={{ background: '#fff3ed', border: `1px solid ${COLORS.orange}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5" style={{ color: COLORS.orange }} />
              <h3 className="font-semibold" style={{ color: COLORS.navy }}>
                Delayed Shipments ({delayedShipments.length})
              </h3>
            </div>
            <div className="space-y-2">
              {delayedShipments.slice(0, 5).map(s => (
                <div key={s._id} className="flex justify-between items-center text-sm">
                  <span className="font-mono text-gray-700">
                    {s.shipmentId || s._id.slice(-8)} – {s.origin} → {s.destination}
                  </span>
                  <Link
                    to={`/shipment_manager/shipments/${s._id}`}
                    className="text-xs hover:underline"
                    style={{ color: COLORS.blue }}
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.navy }}>
              Shipment Status Distribution
            </h2>
            <ShipmentDonutChart donutData={donutData} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.navy }}>
              Vehicle Fleet Status
            </h2>
            <VehicleBarChart vehicleData={vehicleData} />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.navy }}>
              Weekly Shipment Trend
            </h2>
            <WeeklyTrendChart shipments={shipments} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.navy }}>
              Performance Metrics
            </h2>
            <PerformanceBars
              onTimeRate={onTimeRate}
              utilizationRate={stats.utilizationRate}
              completionRate={completionRate}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.navy }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { to: '/shipment_manager/shipments', icon: CubeIcon,     color: COLORS.blue,   title: 'Manage Shipments', desc: 'View and manage all shipments' },
              { to: '/shipment_manager/map',       icon: MapIcon,       color: COLORS.teal,   title: 'Live Map',         desc: 'Real-time fleet tracking' },
              { to: '/shipment_manager/reports',   icon: ChartBarIcon,  color: COLORS.orange, title: 'Reports',          desc: 'View detailed analytics' },
            ].map(({ to, icon: Icon, color, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition group"
              >
                <Icon className="h-8 w-8 mb-2 group-hover:scale-110 transition" style={{ color }} />
                <h3 className="font-semibold" style={{ color: COLORS.navy }}>{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-lg font-semibold" style={{ color: COLORS.navy }}>Recent Shipments</h2>
            <Link
              to="/shipment_manager/shipments"
              className="text-sm hover:underline"
              style={{ color: COLORS.blue }}
            >
              View All →
            </Link>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {recentShipments.length > 0 ? (
              recentShipments.map((shipment) => (
                <div key={shipment._id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {shipment.shipmentId || shipment._id.slice(-8)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(shipment.status, 'shipment')}`}>
                          {getStatusText(shipment.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {shipment.origin} → {shipment.destination}
                      </p>
                      {shipment.plannedDeliveryDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Expected: {new Date(shipment.plannedDeliveryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/shipment_manager/shipments/${shipment._id}`}
                      className="px-3 py-1.5 text-sm rounded-lg hover:opacity-80 transition"
                      style={{ color: COLORS.blue, border: `1px solid ${COLORS.blue}20` }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <CubeIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No shipments found</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShipmentManagerDashboard;