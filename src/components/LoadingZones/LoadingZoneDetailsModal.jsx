import React from 'react';
import { MapPinIcon, CalendarIcon, ArrowsPointingOutIcon, HomeIcon } from '@heroicons/react/24/outline';
import Modal from '../Common/Modal';

const LoadingZoneDetailsModal = ({ zone, onClose }) => {
  const formatDate = (date) => new Date(date).toLocaleString();

  if (!zone) return null;

  return (
    <Modal
      isOpen={!!zone}
      onClose={onClose}
      title={zone.name}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 -mt-2">Loading Zone</p>

        {/* Description */}
        {zone.description && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{zone.description}</p>
          </div>
        )}

        {/* Location */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPinIcon className="h-4 w-4" />
            Location Information
          </h3>
          
          {/* Show placeName if available */}
          {zone.location?.placeName && (
            <div className="mb-3 pb-3 border-b border-gray-200">
              <div className="flex items-start gap-2">
                <HomeIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="text-xs text-gray-500 block">Address</span>
                  <span className="text-sm font-medium text-gray-900">
                    {zone.location.placeName}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Latitude:</span>
              <span className="font-mono font-medium text-gray-900">
                {zone.location?.lat?.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Longitude:</span>
              <span className="font-mono font-medium text-gray-900">
                {zone.location?.lng?.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <ArrowsPointingOutIcon className="h-4 w-4" />
                Radius:
              </span>
              <span className="font-medium text-gray-900">{zone.radiusMeters} meters</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            zone.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {zone.status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Timeline
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900 font-medium">{formatDate(zone.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900 font-medium">{formatDate(zone.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LoadingZoneDetailsModal;