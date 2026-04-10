// frontend/src/pages/AdminDashboard.jsx
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { truckService } from '../services/truckService';
import { shipmentService } from '../services/shipmentService';
import notificationService from '../services/notificationService';
import { driverService } from '../services/driverService';
import { deviceService } from '../services/deviceService';
import { userService } from '../services/userService';
import StatCard from '../components/Cards/StatCard';
import DriverPerformanceCharts from '../components/Charts/DriverPerformanceCharts';

import {
  TruckIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  UserIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

import { chartColors } from '../constants/colors';

const toArray = (r) => {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.users)) return r.users;
  return [];
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: async () => toArray(await truckService.getAll())
  });
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => toArray(await shipmentService.getAll())
  });
   const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: async () => {
      const result = await notificationService.getAll({}, 1, 1000); // increased limit
      return result.notifications || [];
    },
    retry: false
  });
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => toArray(await driverService.getAll())
  });
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => toArray(await deviceService.getAll())
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => toArray(await userService.getAll())
  });

  // Data arrays
  const trucksArray = toArray(trucks);
  const shipmentsArray = toArray(shipments);
  const notificationsArray = toArray(notifications);
  const driversArray = toArray(drivers);
  const devicesArray = toArray(devices);
  const usersArray = toArray(users);
   const mapSeverity = (severity) => {
    switch (severity) {
      case 'critical': return 'high';
      case 'warning': return 'medium';
      case 'info': return 'low';
      default: return 'low';
    }
  };
  // Statistics
  const stats = {
    totalTrucks: trucksArray.length,
    onRoadTrucks: trucksArray.filter(t => t.status === 'in_mission').length,
    availableTrucks: trucksArray.filter(t => t.status === 'available').length,
    maintenanceTrucks: trucksArray.filter(t => t.status === 'maintenance').length,

    totalShipments: shipmentsArray.length,
    activeShipments: shipmentsArray.filter(s => s.status === 'in_progress').length,    // ✅ 'in_progress'
    pendingShipments: shipmentsArray.filter(s => s.status === 'pending').length,
    deliveredShipments: shipmentsArray.filter(s => s.status === 'completed').length,   // ✅ 'completed'
    cancelledShipments: shipmentsArray.filter(s => s.status === 'cancelled').length,

    // Notifications: active = not read and not resolved
    activeNotifications: notificationsArray.filter(n => !n.read && !n.resolved).length,
    // Count by mapped severity
    highSeverityNotifications: notificationsArray.filter(n => mapSeverity(n.severity) === 'high' && !n.read && !n.resolved).length,
    mediumSeverityNotifications: notificationsArray.filter(n => mapSeverity(n.severity) === 'medium' && !n.read && !n.resolved).length,
    lowSeverityNotifications: notificationsArray.filter(n => mapSeverity(n.severity) === 'low' && !n.read && !n.resolved).length,
    totalDrivers: driversArray.length,
    activeDrivers: driversArray.filter(d => d.status === 'active').length,
    onLeaveDrivers: driversArray.filter(d => d.status === 'on_leave').length,

    totalDevices: devicesArray.length,
    activeDevices: devicesArray.filter(d => d.status === 'active').length,
    offlineDevices: devicesArray.filter(d => d.status === 'inactive').length,
    lowBatteryDevices: devicesArray.filter(d => d.batteryLevel < 20).length,

    totalUsers: usersArray.length,
    adminUsers: usersArray.filter(u => u.role === 'admin').length,
    logisticsUsers: usersArray.filter(u => u.role === 'logistics_officer').length,
  };
console.log('******************Trucks array sample:', trucksArray.slice(0, 2));
console.log('Truck statuses:', trucksArray.map(t => t.status));
  const utilizationRate = stats.totalTrucks > 0 ? ((stats.onRoadTrucks / stats.totalTrucks) * 100).toFixed(1) : 0;
  const deliverySuccessRate = stats.totalShipments > 0 ? ((stats.deliveredShipments / stats.totalShipments) * 100).toFixed(1) : 0;

  // Chart data
  const shipmentStatusData = [
  { name: 'In Progress', value: stats.activeShipments, color: chartColors.shipment.inTransit },
  { name: 'Pending', value: stats.pendingShipments, color: chartColors.shipment.pending },
  { name: 'Completed', value: stats.deliveredShipments, color: chartColors.shipment.delivered },
  { name: 'Cancelled', value: stats.cancelledShipments, color: chartColors.shipment.cancelled },
];

  const truckStatusData = [
    { name: 'On Road', value: stats.onRoadTrucks, color: chartColors.truck.onRoad },
    { name: 'Available', value: stats.availableTrucks, color: chartColors.truck.available },
    { name: 'Maintenance', value: stats.maintenanceTrucks, color: chartColors.truck.maintenance },
  ];

  const notificationSeverityData = [
    { name: 'High', value: stats.highSeverityNotifications, color: chartColors.notification.high },
    { name: 'Medium', value: stats.mediumSeverityNotifications, color: chartColors.notification.medium },
    { name: 'Low', value: stats.lowSeverityNotifications, color: chartColors.notification.low },
  ];

  const deviceStatusData = [
    { name: 'Online', value: stats.activeDevices, color: chartColors.device.online },
    { name: 'Offline', value: stats.offlineDevices, color: chartColors.device.offline },
    { name: 'Low Battery', value: stats.lowBatteryDevices, color: chartColors.device.lowBattery },
  ];

  const isLoading = trucksLoading || shipmentsLoading || notificationsLoading || driversLoading || devicesLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time system overview and analytics</p>
        </div>
        {/* <button
          onClick={() => queryClient.invalidateQueries()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-5 w-5 text-gray-600" />
          <span className="text-sm text-gray-600">Refresh</span>
        </button> */}
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Fleet Utilization" value={`${utilizationRate}%`} icon={ChartBarIcon} color="blue" subtitle={`${stats.onRoadTrucks} of ${stats.totalTrucks} trucks in mission`} />        
        <StatCard title="Delivery Success" value={`${deliverySuccessRate}%`} icon={CheckCircleIcon} color="green" subtitle={`${stats.deliveredShipments} of ${stats.totalShipments} delivered`} />
        <StatCard title="Active Notifications" value={stats.activeNotifications} icon={ExclamationTriangleIcon} color="red" subtitle={`${stats.highSeverityNotifications} high priority`} />
        <StatCard title="Devices Online" value={`${stats.totalDevices > 0 ? ((stats.activeDevices / stats.totalDevices) * 100).toFixed(0) : 0}%`} icon={DevicePhoneMobileIcon} color="purple" subtitle={`${stats.activeDevices} of ${stats.totalDevices} devices`} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Trucks" value={stats.totalTrucks} icon={TruckIcon} color="blue" subtitle={`${stats.onRoadTrucks} on road, ${stats.availableTrucks} available`} />
        <StatCard title="Total Drivers" value={stats.totalDrivers} icon={UserGroupIcon} color="green" subtitle={`${stats.activeDrivers} active`} />
        <StatCard title="System Users" value={stats.totalUsers} icon={UserIcon} color="purple" subtitle={`${stats.adminUsers} Admins, ${stats.logisticsUsers} Logistics`} />
        <StatCard title="Total Shipments" value={stats.totalShipments} icon={CubeIcon} color="indigo" subtitle={`${stats.activeShipments} active`} />
        <StatCard title="Total Devices" value={stats.totalDevices} icon={DevicePhoneMobileIcon} color="yellow" subtitle={`${stats.activeDevices} online`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={shipmentStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                {shipmentStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {shipmentStatusData.map(item => (
              <div key={item.name}>
                <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-xs text-gray-500">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={truckStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                {truckStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {truckStatusData.map(item => (
              <div key={item.name}>
                <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-xs text-gray-500">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Notifications by Severity</h2>
            {stats.activeNotifications > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                {stats.activeNotifications} Total
              </span>
            )}
          </div>
          {stats.activeNotifications === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500">No active notifications.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={notificationSeverityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {notificationSeverityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Health</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deviceStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" /><YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {deviceStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {stats.lowBatteryDevices > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                {stats.lowBatteryDevices} device(s) have low battery (&lt;20%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard/trucks" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <TruckIcon className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold">Manage Trucks</h3>
            <p className="text-sm text-gray-500">{stats.totalTrucks} trucks in fleet</p>
          </Link>
          <Link to="/dashboard/drivers" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <UserGroupIcon className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-semibold">Manage Drivers</h3>
            <p className="text-sm text-gray-500">{stats.totalDrivers} drivers, {stats.activeDrivers} active</p>
          </Link>
          <Link to="/dashboard/shipments" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <CubeIcon className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-semibold">Manage Shipments</h3>
            <p className="text-sm text-gray-500">{stats.activeShipments} active shipments</p>
          </Link>
          <Link to="/dashboard/notifications" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition relative">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mb-2" />
            <h3 className="font-semibold">View Notifications</h3>
            <p className="text-sm text-gray-500">{stats.activeNotifications} active notifications</p>
            {stats.highSeverityNotifications > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {stats.highSeverityNotifications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Driver Performance Charts */}
      <div className="mb-8">
        <DriverPerformanceCharts />
      </div>
    </div>
  );
};

export default AdminDashboard;