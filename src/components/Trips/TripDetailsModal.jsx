import React, { useState, useEffect, useRef } from 'react';
import { TruckIcon, UserIcon, ClockIcon, ChartBarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tripHistoryService } from '../../services/tripHistoryService';
import Modal from '../Common/Modal';

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// ─── Map icons ────────────────────────────────────────────────────────────────
const createTruckIcon = () => L.divIcon({
  className: 'custom-truck-icon',
  html: `<div style="background-color:#3B82F6;width:20px;height:20px;border-radius:50%;
                     border:2px solid white;box-shadow:0 0 0 2px #3B82F6;
                     display:flex;align-items:center;justify-content:center;">
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
             <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
           </svg>
         </div>`,
  iconSize: [20, 20],
  popupAnchor: [0, -10],
});

const createStartIcon = () => L.divIcon({
  className: 'custom-start-icon',
  html: '<div style="background-color:#10B981;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #10B981;"></div>',
  iconSize: [12, 12],
  popupAnchor: [0, -6],
});

const createEndIcon = () => L.divIcon({
  className: 'custom-end-icon',
  html: '<div style="background-color:#EF4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #EF4444;"></div>',
  iconSize: [12, 12],
  popupAnchor: [0, -6],
});

// ─── Small reusable components ────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    completed:   'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    cancelled:   'bg-red-100 text-red-800',
    pending:     'bg-yellow-100 text-yellow-800',
    planned:     'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded-full font-medium ${config[status] || 'bg-gray-100 text-gray-800'}`}>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  );
};

const InfoCard = ({ title, children }) => (
  <div className="bg-gray-50 rounded-md p-2">
    <h3 className="text-[10px] font-semibold text-gray-500 mb-1">{title}</h3>
    {children}
  </div>
);

const StatBox = ({ label, value, color }) => (
  <div className={`bg-${color}-50 rounded-md p-1.5 text-center`}>
    <p className={`text-[9px] text-${color}-600`}>{label}</p>
    <p className={`text-xs font-bold text-${color}-900`}>{value}</p>
  </div>
);

// ─── Reverse geocode (lazy, fires only on marker click) ───────────────────────
const reverseGeocode = async (lat, lng) => {
  const res  = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return data.display_name?.split(',').slice(0, 2).join(', ') || null;
};

// ─── Main component ───────────────────────────────────────────────────────────
const TripDetailsModal = ({ trip, onClose }) => {
  const [activeTab,     setActiveTab]     = useState('overview');
  const [tripWithRoute, setTripWithRoute] = useState(null);
  const [loadingRoute,  setLoadingRoute]  = useState(false);

  const mapRef          = useRef(null);
  const mapContainerRef = useRef(null);
  const initTimerRef    = useRef(null);
  const sizeTimerRef    = useRef(null);

  // ── Formatters ─────────────────────────────────────────────────────────────
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDuration = (hours) => {
    if (!hours && hours !== 0) return '—';
    const mins = hours * 60;
    if (mins < 1)  return `${Math.round(mins * 60)}s`;
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  // ── Fetch route once on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!trip?._id) return;
    setLoadingRoute(true);
    tripHistoryService.getTripRoute(trip._id)
      .then(res => setTripWithRoute(res?.data?.route?.points?.length > 0 ? res.data : null))
      .catch(() => setTripWithRoute(null))
      .finally(() => setLoadingRoute(false));
  }, [trip?._id]);

  // ── Map helpers ────────────────────────────────────────────────────────────
  const destroyMap = () => {
    clearTimeout(initTimerRef.current);
    clearTimeout(sizeTimerRef.current);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
  };

  // ── Build / destroy map when tab or data changes ───────────────────────────
  useEffect(() => {
    if (activeTab !== 'map') { destroyMap(); return; }
    if (!tripWithRoute?.route?.points?.length) return;

    initTimerRef.current = setTimeout(() => {
      if (!mapContainerRef.current) return;
      destroyMap();

      const validPoints = tripWithRoute.route.points.filter(
        p => p && typeof p.lat === 'number' && typeof p.lng === 'number'
      );
      if (!validPoints.length) return;

      const leafletPoints = validPoints.map(p => [p.lat, p.lng]);

      try {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        L.polyline(leafletPoints, {
          color: '#3B82F6', weight: 4, opacity: 0.85,
          lineJoin: 'round', lineCap: 'round',
        }).addTo(mapRef.current);

        validPoints.forEach((point, index) => {
          if (index === 0 || index === validPoints.length - 1) return;

          const dot = L.circleMarker([point.lat, point.lng], {
            radius: 4, fillColor: '#3B82F6',
            color: '#ffffff', weight: 1.5,
            opacity: 1, fillOpacity: 0.9,
          }).addTo(mapRef.current);

          dot.on('click', async () => {
            dot.bindPopup('<i>Loading...</i>').openPopup();
            try {
              const name = await reverseGeocode(point.lat, point.lng);
              dot.setPopupContent(
                `<b>📍 ${name || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`}</b>`
              ).openPopup();
            } catch {
              dot.setPopupContent(
                `<b>Point ${index + 1}</b><br>${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
              ).openPopup();
            }
          });
        });
        
        const startMarker = L.marker(leafletPoints[0], { icon: createStartIcon() })
          .bindPopup(`<b>Start</b><br>${trip.origin || 'Origin'}`)
          .addTo(mapRef.current);

        startMarker.on('click', async () => {
          startMarker.bindPopup('<i>Loading...</i>').openPopup();
          try {
            const name = await reverseGeocode(validPoints[0].lat, validPoints[0].lng);
            startMarker.setPopupContent(
              `<b>Start</b><br>${trip.origin || 'Origin'}<br><small>📍 ${name || ''}</small>`
            ).openPopup();
          } catch { /* keep original */ }
        });

        const lastPoint = validPoints[validPoints.length - 1];
        const endMarker = L.marker(leafletPoints[leafletPoints.length - 1], { icon: createEndIcon() })
          .bindPopup(`<b>End</b><br>${trip.destination || 'Destination'}`)
          .addTo(mapRef.current);

        endMarker.on('click', async () => {
          endMarker.bindPopup('<i>Loading...</i>').openPopup();
          try {
            const name = await reverseGeocode(lastPoint.lat, lastPoint.lng);
            endMarker.setPopupContent(
              `<b>End</b><br>${trip.destination || 'Destination'}<br><small>📍 ${name || ''}</small>`
            ).openPopup();
          } catch { /* keep original */ }
        });

        if (trip.status !== 'completed') {
          L.marker(leafletPoints[leafletPoints.length - 1], { icon: createTruckIcon() })
            .bindPopup(`<b>🚛 ${trip.truck?.licensePlate || 'Truck'}</b><br>${trip.driver?.name || ''}`)
            .addTo(mapRef.current);
        }

        sizeTimerRef.current = setTimeout(() => {
          if (!mapRef.current) return;
          mapRef.current.invalidateSize({ animate: false });
          mapRef.current.fitBounds(L.latLngBounds(leafletPoints), {
            padding: [40, 40], maxZoom: 14, animate: true,
          });
        }, 100);

      } catch (err) {
        console.error('Leaflet error:', err);
      }
    }, 300);

    return destroyMap;
  }, [activeTab, tripWithRoute, trip]);

  useEffect(() => () => destroyMap(), []);

  const estimatedDuration = trip.plannedDepartureDate && trip.plannedDeliveryDate
    ? (new Date(trip.plannedDeliveryDate) - new Date(trip.plannedDepartureDate)) / 3_600_000
    : null;

  const actualDuration = trip.actualDurationHours;
  const isFaster    = actualDuration && estimatedDuration && actualDuration < estimatedDuration;
  const isSlower    = actualDuration && estimatedDuration && actualDuration > estimatedDuration;
  const diffPercent = actualDuration && estimatedDuration
    ? Math.abs(((actualDuration - estimatedDuration) / estimatedDuration) * 100).toFixed(0)
    : null;

  const getOnTimeStatus = () => {
    if (!trip.endTime || !trip.plannedDeliveryDate) return null;
    const diffHours = (new Date(trip.endTime) - new Date(trip.plannedDeliveryDate)) / 3_600_000;
    if (diffHours <= 0)  return { text: 'Early',    color: 'text-green-600' };
    if (diffHours <= 2)  return { text: 'On Time',  color: 'text-blue-600' };
    if (diffHours <= 24) return { text: 'Late',      color: 'text-orange-600' };
    return                      { text: 'Very Late', color: 'text-red-600' };
  };

  const onTimeStatus = getOnTimeStatus();
  const hasRouteData = tripWithRoute?.route?.points?.length > 0;

  return (
    <Modal
      isOpen={!!trip}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <TruckIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <span className="text-base font-semibold">Trip Details</span>
            <p className="text-[10px] font-mono text-gray-400">
              {trip.tripNumber || trip._id?.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-3">

        {/* ── Tab bar ── */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview'  },
            { id: 'map',      label: 'Route Map' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto px-0.5">

            {/* Route summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-xs">
                <MapPinIcon className="h-3 w-3 text-green-600" />
                <span className="font-medium text-xs">{trip.origin || '?'}</span>
                <span className="text-gray-400 text-[10px]">→</span>
                <MapPinIcon className="h-3 w-3 text-red-600" />
                <span className="font-medium text-xs">{trip.destination || '?'}</span>
              </div>
              <div className="mt-1"><StatusBadge status={trip.status} /></div>
            </div>

            {/* Duration comparison */}
            {(estimatedDuration || actualDuration) && (
              <div className="bg-blue-50 rounded-md p-2">
                <h3 className="text-[10px] font-semibold mb-1">Duration</h3>
                {estimatedDuration && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Estimated:</span>
                    <span className="font-medium">{formatDuration(estimatedDuration)}</span>
                  </div>
                )}
                {actualDuration > 0 && (
                  <div className="flex justify-between text-[10px] mt-0.5">
                    <span className="text-gray-600">Actual:</span>
                    <span className={`font-semibold ${isFaster ? 'text-green-600' : isSlower ? 'text-red-600' : ''}`}>
                      {formatDuration(actualDuration)}
                      {diffPercent && ` (${isFaster ? `${diffPercent}% faster` : `${diffPercent}% slower`})`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* On-time badge */}
            {onTimeStatus && trip.status === 'completed' && (
              <div className={`${onTimeStatus.color === 'text-green-600' ? 'bg-green-50' : 'bg-blue-50'} rounded-md p-1.5 text-center`}>
                <span className={`text-[10px] font-semibold ${onTimeStatus.color}`}>
                  Delivery: {onTimeStatus.text}
                </span>
              </div>
            )}

            {/* Truck & Driver */}
            <div className="grid grid-cols-2 gap-2">
              <InfoCard title="TRUCK">
                <p className="text-xs font-semibold">{trip.truck?.licensePlate || '—'}</p>
                {trip.truck?.brand && (
                  <p className="text-[10px] text-gray-500">{trip.truck.brand} {trip.truck.model}</p>
                )}
              </InfoCard>
              <InfoCard title="DRIVER">
                <p className="text-xs font-semibold">{trip.driver?.name || '—'}</p>
                {trip.driver?.licenseNumber && (
                  <p className="text-[10px] text-gray-500">Lic: {trip.driver.licenseNumber}</p>
                )}
              </InfoCard>
            </div>

            {/* Performance metrics */}
            <InfoCard title="PERFORMANCE">
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { label: 'Distance',  value: `${trip.actualDistanceKm?.toFixed(1) || '—'} km`   },
                  { label: 'Avg Speed', value: `${trip.averageSpeed?.toFixed(1)      || '—'}` },
                  { label: 'Max Speed', value: `${trip.maxSpeed                      || '—'}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] text-gray-500">{label}</p>
                    <p className="text-xs font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </InfoCard>

            {/* Timeline */}
            <InfoCard title="TIMELINE">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Started:</span>
                  <span className="font-medium">{formatDate(trip.actualStartTime || trip.startTime)}</span>
                </div>
                {trip.endTime && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Ended:</span>
                    <span className="font-medium">{formatDate(trip.endTime)}</span>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="space-y-2">

            {loadingRoute && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                <p className="ml-2 text-xs text-gray-500">Loading route...</p>
              </div>
            )}

            {!loadingRoute && hasRouteData && (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  <StatBox label="GPS Points" value={tripWithRoute.route.points.length} color="blue" />
                  <StatBox label="Distance"   value={`${trip.actualDistanceKm?.toFixed(1) || '—'} km`} color="green" />
                  <StatBox label="Avg Speed"  value={`${trip.averageSpeed?.toFixed(0) || '—'}`} color="purple" />
                </div>

                <div className="flex flex-wrap gap-2 text-[9px] text-gray-400 px-0.5">
                  <span className="flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Start
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> End
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> GPS
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-3 h-0.5 bg-blue-500 rounded inline-block" /> Route
                  </span>
                </div>

                <div
                  ref={mapContainerRef}
                  style={{ height: '360px', width: '100%', minHeight: '360px' }}
                  className="rounded-lg overflow-hidden border border-gray-200 z-0"
                />
              </>
            )}

            {!loadingRoute && !hasRouteData && (
              <div className="text-center py-8">
                <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-500 font-medium">No route data available</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {trip.status === 'in_progress'
                    ? 'Route will appear after completion'
                    : 'No GPS tracking data'}
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </Modal>
  );
};

export default TripDetailsModal;