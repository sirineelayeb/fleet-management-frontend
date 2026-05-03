// frontend/src/components/Customers/CustomerDetailsModal.jsx
import React from 'react';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, CalendarIcon, TruckIcon } from '@heroicons/react/24/outline';
import Modal from '../Common/Modal';

const CustomerDetailsModal = ({ customer, onClose }) => {
  if (!customer) return null;

  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <Modal isOpen={!!customer} onClose={onClose} title={customer.name} size="lg">
      <div className="space-y-4">
        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{customer.phone || '—'}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{customer.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {customer.isActive ? 'Active' : 'Archived'}
          </span>
        </div>

        {/* Recent Shipments */}
        {customer.recentShipments && customer.recentShipments.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <TruckIcon className="h-4 w-4" />
              Recent Shipments ({customer.stats?.totalShipments || 0} total)
            </h3>
            <div className="space-y-2">
              {customer.recentShipments.map((shipment) => (
                <div key={shipment._id} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{shipment.shipmentId}</p>
                      <p className="text-xs text-gray-500">Status: {shipment.status}</p>
                      <p className="text-xs text-gray-500">Weight: {shipment.weightKg} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {shipment.plannedDepartureDate && `Depart: ${new Date(shipment.plannedDepartureDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        {customer.stats && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Shipments</p>
                <p className="text-xl font-bold">{customer.stats.totalShipments}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Weight</p>
                <p className="text-xl font-bold">{customer.stats.totalWeight} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-lg font-semibold text-green-600">{customer.stats.completed}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-lg font-semibold text-amber-600">{customer.stats.pending}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">{formatDate(customer.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900">{formatDate(customer.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerDetailsModal;