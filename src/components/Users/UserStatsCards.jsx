import React from 'react';
import { UserIcon, ShieldCheckIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

const UserStatsCards = ({ stats }) => {
  const cards = [
    { label: 'Total Users', value: stats.total, icon: UserIcon, color: 'text-blue-500' },
    { label: 'Administrators', value: stats.admin, icon: ShieldCheckIcon, color: 'text-red-600' },
    { label: 'Logistics Officers', value: stats.logistics_officer, icon: UserIcon, color: 'text-green-600' },
    { label: 'Shipment Managers', value: stats.shipment_manager, icon: UserIcon, color: 'text-green-600' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStatsCards;