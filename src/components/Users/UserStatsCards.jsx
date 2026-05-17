import React from 'react';
import { UserGroupIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import StatCard from '../Cards/StatCard';

const UserStatsCards = ({ stats }) => {
  const { total = 0, admins = 0, shipmentManagers = 0 } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <StatCard title="Total Users"        value={total}           icon={UserGroupIcon}  color="blue" subtitle="All system users" />
      <StatCard title="Administrators"     value={admins}          icon={ShieldCheckIcon} color="orange" subtitle="Full system access" />
      <StatCard title="Shipment Managers"  value={shipmentManagers} icon={UserIcon}       color="teal" subtitle="Manage shipments" />
    </div>
  );
};

export default UserStatsCards;