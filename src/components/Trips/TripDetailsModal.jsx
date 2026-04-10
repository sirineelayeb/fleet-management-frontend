// frontend/src/components/Trips/TripDetailsModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, MapIcon, TruckIcon, UserIcon, CalendarIcon, ClockIcon, ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tripHistoryService } from '../../services/tripHistoryService';

const TripDetailsModal = ({ trip, onClose }) => {
  const [tripWithRoute, setTripWithRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!trip._id) return;
      setLoading(true);
      try {
        const response = await tripHistoryService.getTripRoute(trip._id);
        setTripWithRoute(response.data);
      } catch (error) {
        console.error('Failed to load trip route:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [trip._id]);

  useEffect(() => {
    if (activeTab !== 'map') return;
    if (!tripWithRoute?.route?.points?.length || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // route.points is already [{lat, lng}, ...]
    const points = tripWithRoute.route.points;
    const leafletPoints = points.map(p => [p.lat, p.lng]);
    const bounds = L.latLngBounds(leafletPoints);

    mapRef.current = L.map(mapContainerRef.current).fitBounds(bounds);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    L.polyline(leafletPoints, { color: '#3B82F6', weight: 4, opacity: 0.8 }).addTo(mapRef.current);

    // Start and end markers
    const start = leafletPoints[0];
    const end = leafletPoints[leafletPoints.length - 1];
    L.marker(start, { title: 'Start' }).addTo(mapRef.current).bindPopup('📍 Start Point');
    L.marker(end, { title: 'End' }).addTo(mapRef.current).bindPopup('🏁 End Point');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [tripWithRoute, activeTab]);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  };

  const formatDuration = (hours) => {
    if (!hours) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Trip {trip.tripNumber || trip._id.slice(-8)}
            </h2>
            <p className="text-sm text-gray-500">
              {trip.origin} → {trip.destination}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <InformationCircleIcon className="h-4 w-4 inline mr-1" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'map'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapIcon className="h-4 w-4 inline mr-1" />
            Route Map
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Truck</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TruckIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{trip.truck?.licensePlate || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{trip.truck?.brand} {trip.truck?.model}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Driver</p>
                  <div className="flex items-center gap-1 mt-1">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{trip.driver?.name || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{trip.driver?.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                    trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                    trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    trip.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trip.status?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Shipment</p>
                  <p className="text-sm mt-1 truncate">{trip.shipment?.description || '—'}</p>
                  <p className="text-xs text-gray-500">{trip.shipment?.shipmentId}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4" /> Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="text-xl font-bold text-gray-900">{trip.actualDistanceKm ? `${trip.actualDistanceKm} km` : '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-xl font-bold text-gray-900">{formatDuration(trip.actualDurationHours)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Average Speed</p>
                    <p className="text-xl font-bold text-gray-900">{trip.averageSpeed ? `${trip.averageSpeed} km/h` : '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Max Speed</p>
                    <p className="text-xl font-bold text-gray-900">{trip.maxSpeed ? `${trip.maxSpeed} km/h` : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" /> Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 w-24">Start Time:</span>
                    <span className="font-medium">{formatDate(trip.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500 w-24">End Time:</span>
                    <span className="font-medium">{formatDate(trip.endTime)}</span>
                  </div>
                  {trip.delayMinutes > 0 && (
                    <div className="flex items-center gap-3 text-sm text-red-600">
                      <ClockIcon className="h-4 w-4" />
                      <span className="w-24">Delay:</span>
                      <span className="font-medium">{trip.delayMinutes} minutes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div>
              {loading && (
                <div className="flex justify-center items-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}
              {!loading && tripWithRoute?.route?.points?.length > 0 ? (
                <div ref={mapContainerRef} className="h-96 w-full rounded-lg overflow-hidden" />
              ) : (
                !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <MapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No route data available for this trip.</p>
                    <p className="text-sm mt-1">The trip may not have GPS tracking data.</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripDetailsModal;