import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TruckIcon, CubeIcon, ExclamationTriangleIcon,
  UserGroupIcon, DevicePhoneMobileIcon, CheckCircleIcon,
  StarIcon, TrophyIcon
} from '@heroicons/react/24/outline';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend,
  BarChart, Bar,
  PieChart, Pie,
  Cell,
} from 'recharts';

import { truckService } from '../services/truckService';
import { shipmentService } from '../services/shipmentService';
import notificationService from '../services/notificationService';
import { driverService } from '../services/driverService';
import { deviceService } from '../services/deviceService';
import StatCard from '../components/Cards/StatCard';

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
  if (Array.isArray(r?.users)) return r.users;
  return [];
};

const mapSeverity = (s) => ({ critical: 'high', warning: 'medium', info: 'low' }[s] || 'low');
const pct = (v, t) => (t > 0 ? parseFloat(((v / t) * 100).toFixed(1)) : 0);
const fmt = (val) => (val > 0 ? `${val}` : '—');

// ============================================
// SHARED UI
// ============================================

const EmptyChart = ({ icon: Icon, message, height = 220 }) => (
  <div className="flex flex-col items-center justify-center text-gray-400" style={{ height }}>
    <Icon className="h-10 w-10 mb-2 text-gray-300" />
    <p className="text-sm font-medium text-gray-400">{message}</p>
    <p className="text-xs text-gray-300 mt-1">Data will appear here once available</p>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div
      className="animate-spin rounded-full h-12 w-12 border-b-2"
      style={{ borderColor: COLORS.orange }}
    />
  </div>
);

const ChartCard = ({ title, icon: Icon, iconColor, linkTo, linkColor, children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow flex flex-col h-full ${className}`}>
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" style={{ color: iconColor || '#9ca3af' }} />}
        <p className="text-sm font-semibold" style={{ color: COLORS.navy }}>{title}</p>
      </div>
      {linkTo && (
        <Link to={linkTo} className="text-xs hover:opacity-75" style={{ color: linkColor || '#9ca3af' }}>
          View All →
        </Link>
      )}
    </div>
    <div className="flex-1 px-5 py-4 flex flex-col justify-center min-h-[220px]">
      {children}
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, iconColor, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5" style={{ color: iconColor }} />
    <h2 className="text-base font-semibold" style={{ color: COLORS.navy }}>{title}</h2>
  </div>
);

// ============================================
// DATA FETCHING
// ============================================

const useDashboardData = () => {
  const { data: trucks = [], isLoading: l1, isError: e1 } = useQuery({
    queryKey: ['trucks'],
    queryFn: async () => toArray(await truckService.getAll()),
  });
  const { data: shipments = [], isLoading: l2, isError: e2 } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => toArray(await shipmentService.getAll()),
  });
  const { data: notifications = [], isLoading: l3, isError: e3 } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const r = await notificationService.getAll({}, 1, 1000);
      return r.notifications || [];
    },
  });
  const { data: drivers = [], isLoading: l4, isError: e4 } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => toArray(await driverService.getAll()),
  });
  const { data: devices = [], isLoading: l5, isError: e5 } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => toArray(await deviceService.getAll()),
  });

  return {
    isLoading: l1 || l2 || l3 || l4 || l5,
    hasError: e1 || e2 || e3 || e4 || e5,
    trucks: toArray(trucks),
    shipments: toArray(shipments),
    notifications: toArray(notifications),
    drivers: toArray(drivers),
    devices: toArray(devices),
  };
};

// ============================================
// STATS
// ============================================

const useStats = (trucks, shipments, notifications, drivers, devices) =>
  useMemo(() => {
    const unresolved = notifications.filter(n => !n.read && !n.resolved);

    const tripsPerDriver = {};
    shipments.forEach(shipment => {
      if (shipment.driver) {
        const driverId = shipment.driver._id || shipment.driver;
        if (driverId) tripsPerDriver[driverId] = (tripsPerDriver[driverId] || 0) + 1;
      }
    });

    return {
      trucks: {
        total: trucks.length,
        available: trucks.filter(t => t.status === 'available').length,
        inMission: trucks.filter(t => t.status === 'in_mission').length,
        maintenance: trucks.filter(t => t.status === 'maintenance').length,
        inactive: trucks.filter(t => t.status === 'inactive').length,
        utilization: pct(trucks.filter(t => t.status === 'in_mission').length, trucks.length),
      },
      shipments: {
        total: shipments.length,
        inProgress: shipments.filter(s => s.status === 'in_progress').length,
        pending: shipments.filter(s => s.status === 'pending').length,
        completed: shipments.filter(s => s.status === 'completed').length,
        cancelled: shipments.filter(s => s.status === 'cancelled').length,
        successRate: pct(shipments.filter(s => s.status === 'completed').length, shipments.length),
      },
      notifications: {
        total: unresolved.length,
        high: unresolved.filter(n => mapSeverity(n.severity) === 'high').length,
        medium: unresolved.filter(n => mapSeverity(n.severity) === 'medium').length,
        low: unresolved.filter(n => mapSeverity(n.severity) === 'low').length,
      },
      drivers: {
        total: drivers.length,
        available: drivers.filter(d => d.status === 'available').length,
        busy: drivers.filter(d => d.status === 'busy').length,
        offline: drivers.filter(d => d.status === 'offline').length,
        scoreData: drivers
          .map(d => ({
            name: d.name?.split(' ')[0] || 'Unknown',
            fullName: d.name,
            score: d.score || d.rating || 75,
            status: d.status,
            trips: tripsPerDriver[d._id] || 0,
            licenseNumber: d.licenseNumber,
            phone: d.phone,
            _id: d._id,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5),
        averageScore:
          drivers.reduce((sum, d) => sum + (d.score || d.rating || 75), 0) / (drivers.length || 1),
      },
      devices: {
        total: devices.length,
        active: devices.filter(d => d.status === 'active').length,
        inactive: devices.filter(d => d.status === 'inactive').length,
        lowBattery: devices.filter(d => d.batteryLevel < 20).length,
        onlineRate: pct(devices.filter(d => d.status === 'active').length, devices.length),
      },
    };
  }, [trucks, shipments, notifications, drivers, devices]);

// ============================================
// CHART COMPONENTS
// ============================================

const FleetRadialChart = ({ stats }) => {
  const data = [
    { name: 'Available',   value: stats.trucks.available,   fill: COLORS.teal   },
    { name: 'In Mission',  value: stats.trucks.inMission,   fill: COLORS.blue   },
    { name: 'Maintenance', value: stats.trucks.maintenance, fill: COLORS.orange  },
    { name: 'Inactive',    value: stats.trucks.inactive,    fill: '#9ca3af'      },
  ];

  return (
    <ChartCard
      title="Fleet status breakdown"
      icon={TruckIcon} iconColor={COLORS.orange}
      linkTo="/dashboard/trucks" linkColor={COLORS.orange}
    >
      {stats.trucks.total === 0 ? (
        <EmptyChart icon={TruckIcon} message="No trucks registered yet" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius={30} outerRadius={100}
            barSize={14} data={data}
            startAngle={180} endAngle={-180}
          >
            <RadialBar minAngle={5} background={{ fill: '#f3f4f6' }} clockWise dataKey="value">
              {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </RadialBar>
            <Legend
              iconSize={10} iconType="square"
              formatter={(_, entry) => (
                <span style={{ fontSize: 12, color: '#6b7280' }}>{entry.payload.name}</span>
              )}
            />
            <Tooltip
              formatter={(val, _, props) => {
                const pctVal = stats.trucks.total > 0
                  ? ((val / stats.trucks.total) * 100).toFixed(1) : 0;
                return [`${val} trucks (${pctVal}%)`, props.payload.name];
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};

const DONUT_COLORS = {
  'Completed':   COLORS.teal,
  'In Progress': COLORS.blue,
  'Pending':     COLORS.orange,
  'Cancelled':   '#9ca3af',
};

const ShipmentDonutChart = ({ stats }) => {
  const donutData = [
    { name: 'Completed',   value: stats.shipments.completed  },
    { name: 'In Progress', value: stats.shipments.inProgress },
    { name: 'Pending',     value: stats.shipments.pending    },
    { name: 'Cancelled',   value: stats.shipments.cancelled  },
  ].filter(d => d.value > 0);

  return (
    <ChartCard
      title="Shipment status distribution"
      icon={CubeIcon} iconColor={COLORS.blue}
      linkTo="/dashboard/shipments" linkColor={COLORS.blue}
    >
      {stats.shipments.total === 0 ? (
        <EmptyChart icon={CubeIcon} message="No shipments recorded yet" />
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={DONUT_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-1/2 space-y-2">
            {donutData.map((item) => (
              <div key={item.name} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DONUT_COLORS[item.name] }} />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {((item.value / stats.shipments.total) * 100).toFixed(0)}%
                  </span>
                  <span className="font-semibold text-gray-900 text-sm min-w-[1.5rem] text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center px-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</span>
              <span className="font-bold text-gray-900">{stats.shipments.total}</span>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
};

const DriverRadarChart = ({ stats }) => {
  const data = [
    { metric: 'Available Drivers', value: pct(stats.drivers.available, stats.drivers.total) },
    { metric: 'Off Duty',          value: pct(stats.drivers.busy, stats.drivers.total) },
    { metric: 'Fleet Active',      value: stats.trucks.utilization },
    { metric: 'Devices Up',        value: stats.devices.onlineRate },
    { metric: 'Delivery %',        value: stats.shipments.successRate },
  ];

  return (
    <ChartCard
      title="Operations health radar"
      icon={UserGroupIcon} iconColor={COLORS.teal}
      linkTo="/dashboard/drivers" linkColor={COLORS.teal}
    >
      {stats.drivers.total === 0 ? (
        <EmptyChart icon={UserGroupIcon} message="No operational data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Radar
              name="System" dataKey="value"
              stroke={COLORS.orange} fill={COLORS.orange} fillOpacity={0.25}
              dot={{ r: 3, fill: COLORS.orange }}
            />
            <Tooltip formatter={(val) => [`${val}%`]} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};

const TrendAreaChart = ({ devices, notifications }) => {
  const weeklyData = useMemo(() => {
    const now = new Date();
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
      const target = new Date(now);
      const diff = (now.getDay() + 6 - i) % 7;
      target.setDate(now.getDate() - diff);
      target.setHours(0, 0, 0, 0);
      const next = new Date(target);
      next.setDate(target.getDate() + 1);
      return {
        day,
        devices: devices.filter(d => {
          const seen = d.lastSeen ? new Date(d.lastSeen) : null;
          return seen && seen >= target && seen < next;
        }).length,
        alerts: notifications.filter(n => {
          const created = n.createdAt ? new Date(n.createdAt) : null;
          return created && created >= target && created < next && !n.resolved;
        }).length,
      };
    });
  }, [devices, notifications]);

  const hasData = devices.length > 0 || notifications.length > 0;

  return (
    <ChartCard
      title="Weekly devices & alerts trend"
      icon={DevicePhoneMobileIcon} iconColor={COLORS.blue}
      linkTo="/dashboard/devices" linkColor={COLORS.blue}
    >
      {!hasData ? (
        <EmptyChart icon={DevicePhoneMobileIcon} message="No device activity this week" />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gDevices" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAlerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.orange} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="devices" stroke={COLORS.blue}   fill="url(#gDevices)" strokeWidth={2} name="Devices online" />
              <Area type="monotone" dataKey="alerts"  stroke={COLORS.orange} fill="url(#gAlerts)"  strokeWidth={2} name="Active alerts" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className="inline-block w-3 h-0.5" style={{ backgroundColor: COLORS.blue }} /> Devices online
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className="inline-block w-3 h-0.5" style={{ backgroundColor: COLORS.orange }} /> Active alerts
            </span>
          </div>
        </>
      )}
    </ChartCard>
  );
};

const getScoreColor = (score) => {
  if (score >= 90) return COLORS.teal;
  if (score >= 75) return COLORS.blue;
  if (score >= 60) return COLORS.gold;
  return COLORS.orange;
};

const getBadgeStyle = (score) => {
  if (score >= 90) return { background: '#d1faf8', color: '#0f6e56' };
  if (score >= 75) return { background: '#dbeafe', color: '#1e40af' };
  if (score >= 60) return { background: '#fef9c3', color: '#854d0e' };
  return { background: '#ffedd5', color: '#9a3412' };
};

const DriverScoreChart = ({ stats }) => (
  <ChartCard
    title="Top driver performance scores"
    icon={StarIcon} iconColor={COLORS.gold}
    linkTo="/dashboard/drivers" linkColor={COLORS.gold}
  >
    {stats.drivers.scoreData.length === 0 ? (
      <EmptyChart icon={UserGroupIcon} message="No driver scores available yet" />
    ) : (
      <>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={stats.drivers.scoreData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} width={80} />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Score']}
              labelFormatter={(label) => `Driver: ${label}`}
            />
            <Bar dataKey="score" name="Performance Score" radius={[0, 8, 8, 0]} barSize={20}>
              {stats.drivers.scoreData.map((entry, i) => (
                <Cell key={i} fill={getScoreColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
          {[
            { color: COLORS.teal,   label: 'Excellent (90–100)' },
            { color: COLORS.blue,   label: 'Good (75–89)' },
            { color: COLORS.gold,   label: 'Average (60–74)' },
            { color: COLORS.orange, label: 'Needs training (<60)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </ChartCard>
);

const DriverRankingList = ({ stats }) => {
  const getMedal = (rank) => {
    if (rank === 0) return <TrophyIcon className="h-5 w-5" style={{ color: COLORS.gold }} />;
    if (rank === 1) return <TrophyIcon className="h-5 w-5 text-gray-400" />;
    if (rank === 2) return <TrophyIcon className="h-5 w-5" style={{ color: COLORS.orange }} />;
    return <span className="text-gray-400 font-bold text-sm">#{rank + 1}</span>;
  };

  return (
    <ChartCard
      title="Driver performance rankings"
      icon={TrophyIcon} iconColor={COLORS.gold}
      linkTo="/dashboard/drivers" linkColor={COLORS.gold}
    >
      {stats.drivers.scoreData.length === 0 ? (
        <EmptyChart icon={TrophyIcon} message="No driver rankings available yet" />
      ) : (
        <div className="space-y-3">
          {stats.drivers.scoreData.map((driver, idx) => (
            <Link
              key={driver._id}
              to={`/dashboard/driver-history/${driver._id}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center">{getMedal(idx)}</div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:opacity-75 transition text-sm">
                    {driver.fullName || driver.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {driver.trips} trip{driver.trips !== 1 ? 's' : ''} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="px-2 py-1 rounded-full text-xs font-bold"
                  style={getBadgeStyle(driver.score)}
                >
                  {driver.score}%
                </div>
                <StarIcon
                  className="h-4 w-4"
                  style={{ color: driver.score >= 90 ? COLORS.gold : '#d1d5db' }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </ChartCard>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AdminDashboard = () => {
  const { isLoading, trucks, shipments, notifications, drivers, devices } = useDashboardData();
  const stats = useStats(trucks, shipments, notifications, drivers, devices);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.navy }}>Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time system overview</p>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Fleet utilization"
          value={stats.trucks.total === 0 ? '—' : `${stats.trucks.utilization}%`}
          icon={TruckIcon} color="orange"
          subtitle={`${stats.trucks.inMission} / ${stats.trucks.total} in mission`}
        />
        <StatCard
          title="Delivery success"
          value={stats.shipments.total === 0 ? '—' : `${stats.shipments.successRate}%`}
          icon={CheckCircleIcon} color="gold"
          subtitle={`${fmt(stats.shipments.completed)} completed`}
        />
        <StatCard
          title="Active alerts"
          value={stats.notifications.total}
          icon={ExclamationTriangleIcon} color="red"
          subtitle={`${fmt(stats.notifications.high)} high priority`}
        />
        <StatCard
          title="Devices online"
          value={stats.devices.total === 0 ? '—' : `${stats.devices.onlineRate}%`}
          icon={DevicePhoneMobileIcon} color="blue"
          subtitle={`${stats.devices.active} / ${stats.devices.total} active`}
        />
      </div>

      {/* ── Fleet & Shipments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <FleetRadialChart stats={stats} />
        <ShipmentDonutChart stats={stats} />
      </div>

      {/* ── Devices & Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <DriverRadarChart stats={stats} />
        <TrendAreaChart devices={devices} notifications={notifications} />
      </div>

      {/* ── Drivers section ── */}
      <SectionTitle icon={UserGroupIcon} iconColor={COLORS.gold} title="Drivers" />

      {/* Driver mini-stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total drivers"  value={stats.drivers.total}                         icon={UserGroupIcon}   color="navy"   />
        <StatCard title="Available"      value={stats.drivers.available}                     icon={CheckCircleIcon} color="teal"   />
        <StatCard title="Off duty"       value={stats.drivers.busy}                          icon={TruckIcon}       color="blue"   />
        <StatCard title="Avg score"      value={`${stats.drivers.averageScore.toFixed(0)}%`} icon={StarIcon}        color="gold"   />
      </div>

      {/* Driver charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <DriverScoreChart stats={stats} />
        <DriverRankingList stats={stats} />
      </div>

      {/* ── High-priority alert banner ── */}
      {stats.notifications.high > 0 && (
        <Link
          to="/dashboard/notifications"
          className="flex items-center justify-between rounded-lg p-4 hover:opacity-90 transition"
          style={{ background: '#fff3ed', border: `1px solid ${COLORS.orange}` }}
        >
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" style={{ color: COLORS.orange }} />
            <span className="text-sm font-medium" style={{ color: COLORS.navy }}>
              {stats.notifications.high} high-priority alert{stats.notifications.high > 1 ? 's' : ''} require attention
            </span>
          </div>
          <span className="text-sm" style={{ color: COLORS.orange }}>View →</span>
        </Link>
      )}

    </div>
  );
};

export default AdminDashboard;