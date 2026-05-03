import React from 'react';
import { 
  PencilIcon, TrashIcon, EnvelopeIcon, CalendarIcon,
  CheckBadgeIcon, XMarkIcon, UserIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';

const getRoleIcon = (role) => {
  return role === 'admin' ? <ShieldCheckIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />;
};

const getRoleLabel = (role) => {
  return role === 'admin' ? 'Administrator' : 'Shipment Manager';
};

const getRoleBadgeStyle = (role) => {
  return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
};

const UserRow = ({ user, onEdit, onDelete }) => {
  const badgeStyle = getRoleBadgeStyle(user.role);
  const roleLabel = getRoleLabel(user.role);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
            {getRoleIcon(user.role)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">ID: {user._id.slice(-6)}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{user.email}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${badgeStyle}`}>
            {getRoleIcon(user.role)}
            <span>{roleLabel}</span>
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${
          user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {user.isActive ? (
            <><CheckBadgeIcon className="h-3 w-3" /> Active</>
          ) : (
            <><XMarkIcon className="h-3 w-3" /> Inactive</>
          )}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
          <PencilIcon className="h-5 w-5" />
        </button>
        <button onClick={() => onDelete(user)} className="text-red-600 hover:text-red-900" title="Delete">
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
};

export default UserRow;