import React from 'react';
import { UserGroupIcon, ShieldCheckIcon, UserIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import StatCard from '../Cards/StatCard';

const UserStatsCards = ({ stats }) => {
  // stats should contain: total, admins, shipmentManagers, active, inactive
  const {
    total = 0,
    admins = 0,
    shipmentManagers = 0,
    active = 0,
    inactive = 0
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <StatCard
        title="Total Users"
        value={total}
        icon={UserGroupIcon}
        color="purple"
        subtitle="All system users"
      />
      <StatCard
        title="Administrators"
        value={admins}
        icon={ShieldCheckIcon}
        color="red"
        subtitle="Full system access"
      />
      <StatCard
        title="Shipment Managers"
        value={shipmentManagers}
        icon={UserIcon}
        color="green"
        subtitle="Manage shipments"
      />
      <StatCard
        title="Active Users"
        value={active}
        icon={CheckCircleIcon}
        color="blue"
        subtitle="Currently active"
      />
      <StatCard
        title="Inactive Users"
        value={inactive}
        icon={XCircleIcon}
        color="yellow"
        subtitle="Disabled accounts"
      />
    </div>
  );
};

export default UserStatsCards;