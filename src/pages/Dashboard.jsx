import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { truckService } from '../services/truckService';
import { shipmentService } from '../services/shipmentService';
import { alertService } from '../services/alertService';
import StatCard from '../components/Cards/StatCard';
import { TruckIcon, CubeIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { data: trucks } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => truckService.getAll().then(res => res.data),
  });

  const { data: shipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentService.getAll().then(res => res.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAll().then(res => res.data),
  });

  const stats = {
    totalTrucks: trucks?.data?.length || 0,
    activeShipments: shipments?.data?.filter(s => s.status === 'in_transit').length || 0,
    pendingDeliveries: shipments?.data?.filter(s => s.status === 'pending').length || 0,
    activeAlerts: alerts?.data?.filter(a => a.status === 'active').length || 0,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to HaulTrackm</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Trucks"
          value={stats.totalTrucks}
          icon={TruckIcon}
          color="blue"
        />
        <StatCard
          title="Active Shipments"
          value={stats.activeShipments}
          icon={CubeIcon}
          color="green"
        />
        <StatCard
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
          icon={CheckCircleIcon}
          color="yellow"
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Shipments</h2>
          <div className="space-y-3">
            {shipments?.data?.slice(0, 5).map(shipment => (
              <div key={shipment._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{shipment.shipmentNumber}</p>
                  <p className="text-sm text-gray-500">To: {shipment.destination?.address}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {shipment.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {alerts?.data?.filter(a => a.status === 'active').slice(0, 5).map(alert => (
              <div key={alert._id} className="flex justify-between items-center p-3 bg-red-50 rounded border-l-4 border-red-500">
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
