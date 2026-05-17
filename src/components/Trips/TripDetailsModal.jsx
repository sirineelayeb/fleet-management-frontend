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
  html: `<div style="background-color:#3B82F6;width:24px;height:24px;border-radius:50%;
                     border:3px solid white;box-shadow:0 0 0 2px #3B82F6;
                     display:flex;align-items:center;justify-content:center;">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
             <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
           </svg>
         </div>`,
  iconSize: [24, 24],
  popupAnchor: [0, -12],
});

const createStartIcon = () => L.divIcon({
  className: 'custom-start-icon',
  html: '<div style="background-color:#10B981;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #10B981;"></div>',
  iconSize: [16, 16],
  popupAnchor: [0, -8],
});

const createEndIcon = () => L.divIcon({
  className: 'custom-end-icon',
  html: '<div style="background-color:#EF4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #EF4444;"></div>',
  iconSize: [16, 16],
  popupAnchor: [0, -8],
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
    <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${config[status] || 'bg-gray-100 text-gray-800'}`}>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  );
};

const InfoCard = ({ title, icon: Icon, children, iconColor = 'text-blue-600' }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
      {Icon && <Icon className={`h-3 w-3 ${iconColor}`} />}
      {title}
    </h3>
    {children}
  </div>
);

const StatBox = ({ label, value, color }) => (
  <div className={`bg-${color}-50 rounded-lg p-2 text-center`}>
    <p className={`text-xs text-${color}-600`}>{label}</p>
    <p className={`text-lg font-bold text-${color}-900`}>{value}</p>
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
    if (mins < 1)  return `${Math.round(mins * 60)} sec`;
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m === 0 ? `${h} h` : `${h}h ${m}m`;
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

    // Wait for tab transition + DOM paint
    initTimerRef.current = setTimeout(() => {
      if (!mapContainerRef.current) return;
      destroyMap();

      const validPoints = tripWithRoute.route.points.filter(
        p => p && typeof p.lat === 'number' && typeof p.lng === 'number'
      );
      if (!validPoints.length) return;

      const leafletPoints = validPoints.map(p => [p.lat, p.lng]);

      try {
        // 1 — Create map instance
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // 2 — Tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // 3 — Route polyline
        L.polyline(leafletPoints, {
          color: '#3B82F6', weight: 5, opacity: 0.85,
          lineJoin: 'round', lineCap: 'round',
        }).addTo(mapRef.current);

        // 4 — Intermediate GPS dots (click → reverse geocode)
        validPoints.forEach((point, index) => {
          if (index === 0 || index === validPoints.length - 1) return;

          const dot = L.circleMarker([point.lat, point.lng], {
            radius: 5, fillColor: '#3B82F6',
            color: '#ffffff', weight: 2,
            opacity: 1, fillOpacity: 0.9,
          }).addTo(mapRef.current);

          dot.on('click', async () => {
            dot.bindPopup('<i>Loading location...</i>').openPopup();
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
        
        // 5 — Start marker
        const startMarker = L.marker(leafletPoints[0], { icon: createStartIcon() })
          .bindPopup(`<b>🟢 Start</b><br>${trip.origin || 'Origin'}`)
          .addTo(mapRef.current);

        startMarker.on('click', async () => {
          startMarker.bindPopup('<i>Loading location...</i>').openPopup();
          try {
            const name = await reverseGeocode(validPoints[0].lat, validPoints[0].lng);
            startMarker.setPopupContent(
              `<b>🟢 Start</b><br>${trip.origin || 'Origin'}<br><small>📍 ${name || ''}</small>`
            ).openPopup();
          } catch { /* keep original popup */ }
        });

        // 6 — End marker
        const lastPoint  = validPoints[validPoints.length - 1];
        const endMarker  = L.marker(leafletPoints[leafletPoints.length - 1], { icon: createEndIcon() })
          .bindPopup(`<b>🔴 End</b><br>${trip.destination || 'Destination'}`)
          .addTo(mapRef.current);

        endMarker.on('click', async () => {
          endMarker.bindPopup('<i>Loading location...</i>').openPopup();
          try {
            const name = await reverseGeocode(lastPoint.lat, lastPoint.lng);
            endMarker.setPopupContent(
              `<b>🔴 End</b><br>${trip.destination || 'Destination'}<br><small>📍 ${name || ''}</small>`
            ).openPopup();
          } catch { /* keep original popup */ }
        });

        // 7 — Live truck marker (only when in progress)
        if (trip.status !== 'completed') {
          L.marker(leafletPoints[leafletPoints.length - 1], { icon: createTruckIcon() })
            .bindPopup(`<b>🚛 ${trip.truck?.licensePlate || 'Truck'}</b><br>${trip.driver?.name || ''}`)
            .addTo(mapRef.current);
        }

        // 8 — invalidateSize first, then fitBounds (separate tick)
        sizeTimerRef.current = setTimeout(() => {
          if (!mapRef.current) return;
          mapRef.current.invalidateSize({ animate: false });
          mapRef.current.fitBounds(L.latLngBounds(leafletPoints), {
            padding: [50, 50], maxZoom: 14, animate: true,
          });
        }, 100);

              } catch (err) {
                console.error('Leaflet error:', err);
              }
            }, 300);

            return destroyMap;
          }, [activeTab, tripWithRoute, trip]);


  // Cleanup on modal unmount
  useEffect(() => () => destroyMap(), []);

  // ── Derived values ─────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={!!trip}
      onClose={onClose}
      size="xl"
      title={
        <div>
          <span className="text-lg font-semibold">Trip Details</span>
          <p className="text-xs font-mono text-gray-500 mt-0.5">
            {trip.tripNumber || trip._id?.slice(-8).toUpperCase()}
          </p>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Tab bar ───────────────────────────────────────────────────── */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview'  },
            { id: 'map',      label: 'Route Map' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">

            {/* Route summary banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-sm">
                <MapPinIcon className="h-3 w-3 text-green-600" />
                <span className="font-medium">{trip.origin      || '?'}</span>
                <span className="text-gray-400">→</span>
                <MapPinIcon className="h-3 w-3 text-red-600" />
                <span className="font-medium">{trip.destination || '?'}</span>
              </div>
              <div className="mt-2"><StatusBadge status={trip.status} /></div>
            </div>

            {/* Duration comparison */}
            {(estimatedDuration || actualDuration) && (
              <div className="bg-blue-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2">⏱️ Duration</h3>
                {estimatedDuration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">📋 Estimated:</span>
                    <span className="font-medium">{formatDuration(estimatedDuration)}</span>
                  </div>
                )}
                {actualDuration > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">✅ Actual:</span>
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
              <div className={`${onTimeStatus.color === 'text-green-600' ? 'bg-green-50' : 'bg-blue-50'} rounded-lg p-2 text-center`}>
                <span className={`text-sm font-semibold ${onTimeStatus.color}`}>
                  {onTimeStatus.icon} Delivery: {onTimeStatus.text}
                </span>
              </div>
            )}

            {/* Truck & Driver */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard title="TRUCK" icon={TruckIcon}>
                <p className="text-sm font-semibold">{trip.truck?.licensePlate || '—'}</p>
                {trip.truck?.brand && (
                  <p className="text-xs text-gray-500">{trip.truck.brand} {trip.truck.model}</p>
                )}
              </InfoCard>
              <InfoCard title="DRIVER" icon={UserIcon} iconColor="text-green-600">
                <p className="text-sm font-semibold">{trip.driver?.name || '—'}</p>
                {trip.driver?.licenseNumber && (
                  <p className="text-xs text-gray-500">License: {trip.driver.licenseNumber}</p>
                )}
              </InfoCard>
            </div>

            {/* Performance metrics */}
            <InfoCard title="PERFORMANCE" icon={ChartBarIcon} iconColor="text-purple-600">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Distance',  value: `${trip.actualDistanceKm?.toFixed(1) || '—'} km`   },
                  { label: 'Avg Speed', value: `${trip.averageSpeed?.toFixed(1)      || '—'} km/h` },
                  { label: 'Max Speed', value: `${trip.maxSpeed                      || '—'} km/h` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-base font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </InfoCard>

            {/* Timeline */}
            <InfoCard title="TIMELINE" icon={ClockIcon} iconColor="text-orange-600">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Started:</span>
                  <span className="font-medium">{formatDate(trip.actualStartTime || trip.startTime)}</span>
                </div>
                {trip.endTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ended:</span>
                    <span className="font-medium">{formatDate(trip.endTime)}</span>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MAP TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'map' && (
          <div className="space-y-3">

            {/* Loading spinner */}
            {loadingRoute && (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <p className="ml-2 text-gray-500">Loading route data...</p>
              </div>
            )}

            {/* Map + stats */}
            {!loadingRoute && hasRouteData && (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <StatBox label="GPS Points" value={tripWithRoute.route.points.length}                    color="blue"   />
                  <StatBox label="Distance"   value={`${trip.actualDistanceKm?.toFixed(1) || '—'} km`}    color="green"  />
                  <StatBox label="Avg Speed"  value={`${trip.averageSpeed?.toFixed(0)     || '—'} km/h`}  color="purple" />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 px-1">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Start
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> End
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> GPS point
                    <span className="text-gray-400">(click for location name)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-1 bg-blue-500 rounded inline-block" /> Route
                  </span>
                </div>

                {/* Map container — explicit px height required by Leaflet */}
                <div
                  ref={mapContainerRef}
                  style={{ height: '420px', width: '100%', minHeight: '420px' }}
                  className="rounded-lg overflow-hidden border border-gray-200 z-0"
                />
              </>
            )}

            {/* Empty state */}
            {!loadingRoute && !hasRouteData && (
              <div className="text-center py-12">
                <MapPinIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No route data available</p>
                <p className="text-sm text-gray-400 mt-1">
                  {trip.status === 'in_progress'
                    ? 'Trip is in progress — route will appear after completion'
                    : 'This trip has no GPS tracking data'}
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