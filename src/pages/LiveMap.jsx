// frontend/src/pages/LiveMap.jsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackingService } from '../services/trackingService';
import { getStatusText } from '../constants/colors';
import webSocketService from '../services/websocket';
import MapStyleSwitcher from '../components/Common/MapStyleSwitcher';
import { getSavedMapPreference, saveMapPreference, MAP_STYLES, getRouteColor } from '../config/mapConfig';
import { useAuth } from '../context/AuthContext';
import { shipmentService } from '../services/shipmentService';
import {
  TruckIcon, ClockIcon, MapPinIcon, ChevronRightIcon,
  BoltIcon, XMarkIcon, GlobeAltIcon, SignalIcon,
  MapIcon, ChevronUpIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

// ---------- Fix Leaflet default icon ----------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Constants ───────────────────────────────────────────────────────────────
const DATA_FRESHNESS_MS = 2 * 60 * 1000; // 2 minutes

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTruckId = (truck) => (truck?._id || truck?.id)?.toString();

const hasCoords = (obj) =>
  obj &&
  typeof obj.lat === 'number' &&
  typeof obj.lng === 'number' &&
  obj.lat !== null &&
  obj.lng !== null &&
  !isNaN(obj.lat) &&
  !isNaN(obj.lng) &&
  !(obj.lat === 0 && obj.lng === 0);

const getLocationFromTruck = (truck) => {
  const loc = truck?.currentLocation;
  if (!loc) return null;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};

const getSpeedFromTruck = (truck) =>
  truck?.currentSpeed || truck?.speed || truck?.trip?.currentSpeed || 0;

const getLastUpdateFromTruck = (truck) =>
  truck?.lastUpdate || truck?.lastTelemetryAt || truck?.updatedAt || new Date().toISOString();

// ---- Freshness-aware helpers ----
const hasLiveSignal = (truck) => {
  const loc = getLocationFromTruck(truck);
  if (!loc) return false;
  const lastUpdate = new Date(getLastUpdateFromTruck(truck));
  return (Date.now() - lastUpdate.getTime()) < DATA_FRESHNESS_MS;
};

const getEffectiveSpeed = (truck) => {
  if (!hasLiveSignal(truck)) return null;
  return getSpeedFromTruck(truck);
};

const isTruckMoving = (truck) => {
  const speed = getEffectiveSpeed(truck);
  return speed !== null && speed > 0;
};
// -------------------------------------------------
// ─── Route offset helper ─────────────────────────────────────────────────────

// Shifts a route by a fixed amount in latitude/longitude (degrees)
const offsetRoute = (points, latOffset, lngOffset) => {
  return points.map(([lat, lng]) => [lat + latOffset, lng + lngOffset]);
};
const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getLocationName = async (lat, lng) => {
  try {
    const result = await trackingService.reverseGeocode(lat, lng);
    return result.name || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  } catch {
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  }
};

const fetchRoutePoints = async (truckId, limit = 500) => {
  try {
    const res = await trackingService.getTruckRoute(truckId, { limit });
    if (!res.data || res.data.length === 0) return [];
    return [...res.data]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map((loc) => {
        if (loc.location?.coordinates?.length === 2) {
          const [lng, lat] = loc.location.coordinates;
          return [lat, lng];
        }
        if (loc.lat && loc.lng) return [loc.lat, loc.lng];
        return null;
      })
      .filter(Boolean);
  } catch (err) {
    console.error(`Failed to fetch route for truck ${truckId}:`, err);
    return [];
  }
};

// ─── Custom hook: detect mobile ─────────────────────────────────────────────

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ─── Truck icons ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  in_mission: '#3B8FF3',   // BRAND.blue
  available: '#9CA3AF',    // BRAND.gray
  maintenance: '#E0B50F',  // BRAND.gold
};

const createTruckIcon = (truck, isSelected = false) => {
  const color = STATUS_COLORS[truck?.status] || '#6B7280';
  const speed = getEffectiveSpeed(truck); // stale → null
  const speedDisplay = speed !== null ? `${speed} km/h` : '—';
  const isMoving = speed !== null && speed > 0;
  const size = isSelected ? 48 : 40;
  const ring = isSelected ? 56 : 48;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${ring}px;height:${ring}px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;
          width:${ring}px;height:${ring}px;
          border-radius:50%;
          background:${color};
          opacity:${isSelected ? 0.35 : 0.18};
          animation:lm-pulse 1.8s ease-in-out infinite;
        "></div>
        <div style="
          position:relative;
          width:${size}px;height:${size}px;
          background:${color};
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          border:${isSelected ? '3px' : '2px'} solid white;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
          font-size:${isSelected ? 20 : 17}px;
          transition:all 0.3s ease;
        ">🚛</div>
        <div style="
          position:absolute;
          bottom:-8px;
          background:${isMoving ? color : '#9CA3AF'};
          color:white;
          font-size:9px;
          font-weight:700;
          padding:2px 5px;
          border-radius:8px;
          box-shadow:0 1px 4px rgba(0,0,0,0.25);
          white-space:nowrap;
          letter-spacing:0.3px;
        ">${speedDisplay}</div>
      </div>
      <style>
        @keyframes lm-pulse {
          0%,100%{transform:scale(0.85);opacity:0.35}
          50%{transform:scale(1.2);opacity:0.1}
        }
      </style>
    `,
    iconSize: [ring, ring],
    iconAnchor: [ring / 2, ring / 2],
    popupAnchor: [0, -(ring / 2 + 4)],
  });
};

// Single shared icon for "last known position" ghosts
const OFFLINE_TRUCK_ICON = L.divIcon({
  className: '',
  html: `
    <div style="
      width:34px;height:34px;
      background:#9CA3AF;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px dashed #ffffff;
      box-shadow:0 2px 6px rgba(0,0,0,0.2);
      font-size:15px;
    ">🚛</div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -20],
});

// ─── Memoized truck marker ──────────────────────────────────────────────────

const TruckMarker = React.memo(function TruckMarker({ truck, isSelected, onSelect, markerRefs }) {
  const loc = getLocationFromTruck(truck);
  if (!hasCoords(loc)) return null;
  const truckId = getTruckId(truck);
  const speed = getEffectiveSpeed(truck);
  const speedDisplay = speed !== null ? `${speed} km/h` : '—';
  const speedColor = speed !== null ? getSpeedColor(speed) : 'text-gray-400';

  return (
    <Marker
      position={[loc.lat, loc.lng]}
      icon={createTruckIcon(truck, isSelected)}
      ref={(ref) => { if (ref && truckId) markerRefs.current[truckId] = ref; }}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(truck) }}
    >
      <Popup>
        <div className="space-y-1 text-sm min-w-[160px]">
          <div className="font-bold text-gray-800">🚛 {truck.licensePlate || 'Unknown'}</div>
          <div className="text-gray-500 text-xs">{truck.brand} {truck.model}</div>
          <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
            <span className="text-gray-400">Speed</span>
            <span className={`font-semibold ${speedColor}`}>{speedDisplay}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Status</span>
            <span className="font-semibold">{getStatusText(truck.status)}</span>
          </div>
          {truck.driver && (
            <div className="text-xs pt-1 border-t border-gray-100 text-gray-500">
              👤 {truck.driver.name || 'No driver'}
            </div>
          )}
          <div className="text-xs text-gray-400 font-mono">
            {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}, (prev, next) => {
  const prevLoc = getLocationFromTruck(prev.truck);
  const nextLoc = getLocationFromTruck(next.truck);
  return (
    prevLoc?.lat === nextLoc?.lat &&
    prevLoc?.lng === nextLoc?.lng &&
    getEffectiveSpeed(prev.truck) === getEffectiveSpeed(next.truck) &&
    prev.truck.status === next.truck.status &&
    prev.isSelected === next.isSelected
  );
});

// ─── Last known position (offline ghost markers) ────────────────────────────

const LastKnownPositionMarkers = ({ trucks, routes }) => (
  <>
    {trucks.map((truck) => {
      // Show ghost only if no live signal (stale or no loc)
      if (hasLiveSignal(truck)) return null;

      const truckId = getTruckId(truck);
      // Use the last known point from route history
      const points = routes[truckId];
      if (!points || points.length === 0) return null;

      const lastPoint = points[points.length - 1];
      const lastSeen = getLastUpdateFromTruck(truck);

      return (
        <Marker
          key={`last-known-${truckId}`}
          position={lastPoint}
          icon={OFFLINE_TRUCK_ICON}
          opacity={0.6}
        >
          <Popup>
            <div className="text-xs space-y-1 min-w-[140px]">
              <p className="font-semibold text-gray-700">🚛 {truck.licensePlate || 'Unknown'}</p>
              <p className="text-gray-500">Last seen: {formatDate(lastSeen)} – No live signal</p>
            </div>
          </Popup>
        </Marker>
      );
    })}
  </>
);

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// ─── Route lines with stable offset ────────────────────────────────────────
const RouteLines = ({ routes, mapStyle }) => {
  const routeColors = getRouteColor(mapStyle);
  const OFFSET_STEP = 0.0005; // ~55 meters – adjust to taste

  const truckIds = Object.keys(routes);

  return (
    <>
      {truckIds.map((truckId) => {
        const points = routes[truckId];
        if (!points || points.length < 2) return null;

        // Generate a stable offset factor (between -3 and +3) from the truckId
        const hash = hashString(truckId);
        const offsetFactor = (hash % 7) - 3; // -3 .. +3
        const latOffset = offsetFactor * OFFSET_STEP;
        const lngOffset = offsetFactor * OFFSET_STEP; // diagonal shift

        const offsetPoints = points.map(([lat, lng]) => [lat + latOffset, lng + lngOffset]);

        return (
          <Polyline
            key={`${truckId}-${mapStyle}`}
            positions={offsetPoints}
            color={routeColors.route}
            weight={4}
            opacity={0.75}
            smoothFactor={1}
          />
        );
      })}
    </>
  );
};

const RoutePointsMarkers = ({ routes, visible }) => {
  if (!visible) return null;
  const pointIcon = L.divIcon({
    html: `<div style="background:#34B1AA;width:6px;height:6px;border-radius:50%;border:1px solid white;opacity:0.7;"></div>`,
    className: '',
    iconSize: [6, 6],
    iconAnchor: [3, 3],
  });
  return (
    <>
      {Object.entries(routes).map(([truckId, points]) => {
        if (!points || points.length === 0) return null;
        return points.map((point, idx) => (
          <Marker key={`${truckId}-point-${idx}`} position={[point[0], point[1]]} icon={pointIcon}>
            <Popup>
              <span className="text-xs">Point #{idx + 1}<br />{point[0].toFixed(5)}, {point[1].toFixed(5)}</span>
            </Popup>
          </Marker>
        ));
      })}
    </>
  );
};

// ─── Shipment markers ────────────────────────────────────────────────────────

const ShipmentMarkers = ({ trucks }) => {
  const startIcon = L.divIcon({
    html: `<div style="background:#34B1AA;width:18px;height:18px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: '', iconSize: [18, 18], popupAnchor: [0, -10],
  });
  const endIcon = L.divIcon({
    html: `<div style="background:#F29F67;width:18px;height:18px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: '', iconSize: [18, 18], popupAnchor: [0, -10],
  });
  return (
    <>
      {trucks.map((truck) => {
        if (!truck.shipment) return null;
        const { originCoordinates, destinationCoordinates } = truck.shipment;
        return (
          <React.Fragment key={getTruckId(truck)}>
            {hasCoords(originCoordinates) && (
              <Marker position={[originCoordinates.lat, originCoordinates.lng]} icon={startIcon}>
                <Popup><span className="text-sm font-medium">📍 Origin: {truck.shipment.origin || 'Start'}</span></Popup>
              </Marker>
            )}
            {hasCoords(destinationCoordinates) && (
              <Marker position={[destinationCoordinates.lat, destinationCoordinates.lng]} icon={endIcon}>
                <Popup><span className="text-sm font-medium">🏁 Destination: {truck.shipment.destination || 'End'}</span></Popup>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ─── Fit bounds ──────────────────────────────────────────────────────────────

const FitBounds = ({ markers, done }) => {
  const map = useMap();
  useEffect(() => {
    if (done.current || !markers || markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60] });
      done.current = true;
    }
  }, [markers, map, done]);
  return null;
};

const PanToTruck = ({ truck }) => {
  const map = useMap();
  const prevTruckId = useRef();
  const ZOOM_LEVEL = 14; // adjust to taste (14–16 works well for trucks)

  useEffect(() => {
    if (!truck) return;
    const location = getLocationFromTruck(truck);
    if (!location) return;
    const truckId = getTruckId(truck);
    if (prevTruckId.current === truckId) return;
    prevTruckId.current = truckId;

    // Fly to the truck with a fixed zoom level
    map.flyTo([location.lat, location.lng], ZOOM_LEVEL, {
      animate: true,
      duration: 0.8,
    });
  }, [truck, map]);
  return null;
};

// ─── Sidebar helpers ─────────────────────────────────────────────────────────

const STATUS_BADGE = {
  in_mission: 'bg-blue-100 text-blue-700',
  on_road:    'bg-teal-100 text-teal-700',
  available:  'bg-gray-100 text-gray-600',
  maintenance:'bg-yellow-100 text-yellow-700',
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-700'}`}>
    {getStatusText(status)}
  </span>
);

// Shows the backend status, UNLESS telemetry disagrees with it (status says
// "inactive" but speed says otherwise) — in which case it trusts the live
// signal over the (possibly stale) backend value. This is a cosmetic
// safety net only; it doesn't fix the underlying lag between a device
// going active and the backend status catching up.
const EffectiveStatusBadge = ({ truck }) => {
  // If data is stale, show "No Signal" and never show "Moving"
  if (!hasLiveSignal(truck)) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-300 text-gray-600">
        No Signal
      </span>
    );
  }

  // Now we know data is recent, we can trust the speed value
  const speed = getSpeedFromTruck(truck);

  // Override backend status if the truck is actually moving (>5 km/h)
  if (speed > 5) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Moving
      </span>
    );
  }

  // Otherwise, fall back to the original status badge
  return <StatusBadge status={truck.status} />;
};

const getSpeedColor = (speed) => {
  if (!speed || speed === 0) return 'text-gray-400';
    if (speed < 60) return 'text-teal-600';
    if (speed < 90) return 'text-yellow-600';
    return 'text-orange-500';
};

// ─── Live location card ───────────────────────────────────────────────────────

const LiveLocationCard = ({ truck }) => {
  const location = getLocationFromTruck(truck);
  const speed = getEffectiveSpeed(truck);
  const lastUpdate = getLastUpdateFromTruck(truck);
  const [locationName, setLocationName] = useState('Locating…');
  const prevLocRef = useRef(null);

  useEffect(() => {
    if (!location) return;
    const key = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
    if (prevLocRef.current === key) return;
    prevLocRef.current = key;
    setLocationName('Locating…');
    getLocationName(location.lat, location.lng).then(setLocationName);
  }, [location]);

  const isMoving = speed !== null && speed > 0;
  const hasSignal = hasLiveSignal(truck);

  return (
    <div className="mx-3 mb-3 rounded-xl overflow-hidden border border-teal-200 shadow-sm">
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasSignal && isMoving ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-white text-xs font-semibold tracking-wide">
            {hasSignal ? (isMoving ? 'LIVE · MOVING' : 'LIVE · STOPPED') : 'NO SIGNAL'}
          </span>
        </div>
        <span className="text-blue-100 text-xs">{formatDate(lastUpdate)}</span>
      </div>
      <div className="bg-white px-3 py-2 space-y-2">
        {location && hasSignal ? (
          <>
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-gray-800 leading-snug">{locationName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400 mb-0.5">LAT</p>
                <p className="text-xs font-mono font-semibold text-gray-700">{location.lat.toFixed(6)}°</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400 mb-0.5">LNG</p>
                <p className="text-xs font-mono font-semibold text-gray-700">{location.lng.toFixed(6)}°</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <BoltIcon className={`h-4 w-4 ${speed !== null ? getSpeedColor(speed) : 'text-gray-400'}`} />
                <span className="text-xs text-gray-500">Speed</span>
              </div>
              <span className={`text-sm font-bold ${speed !== null ? getSpeedColor(speed) : 'text-gray-400'}`}>
                {speed !== null ? `${speed} km/h` : '—'}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 py-3 text-gray-400">
            <SignalIcon className="h-4 w-4 shrink-0" />
            <span className="text-xs">
              No GPS signal{lastUpdate ? ` since ${formatDate(lastUpdate)}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Truck details panel ──────────────────────────────────────────────────────

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center py-0.5">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-xs font-medium text-gray-700 text-right max-w-[55%] truncate">{value}</span>
  </div>
);

const TruckDetailsPanel = ({ truck, onClose, showRoutePoints, onToggleRoutePoints }) => {
  if (!truck) return null;
  const driver = truck.driver;
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[truck.status] || '#9CA3AF' }} />
          <span className="text-sm font-bold text-gray-800">{truck.licensePlate}</span>
          <EffectiveStatusBadge truck={truck} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleRoutePoints}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title={showRoutePoints ? 'Hide route points' : 'Show route points'}
          >
            {showRoutePoints ? '🔘' : '⚫'}
          </button>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XMarkIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      <LiveLocationCard truck={truck} />

      <div className="px-3 pb-3 space-y-3 overflow-y-auto max-h-[45vh] scrollbar-hide">
        <div className="bg-gray-50 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vehicle</p>
          <Row label="Brand / Model" value={`${truck.brand || '—'} ${truck.model || ''}`} />
          <Row label="Capacity" value={truck.capacity ? `${truck.capacity} T` : '—'} />
          <Row label="Year" value={truck.year || '—'} />
        </div>
        {driver && typeof driver === 'object' && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Driver</p>
            <Row label="Name" value={driver.name || '—'} />
            <Row label="Phone" value={driver.phone || '—'} />
            <Row label="Email" value={driver.email || '—'} />
          </div>
        )}
        {truck.shipment ? (
          <div className="bg-blue-50 rounded-xl p-3 space-y-1 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Active Shipment</p>
            <Row label="Origin" value={truck.shipment.origin || '—'} />
            <Row label="Destination" value={truck.shipment.destination || '—'} />
            <Row label="Status" value={truck.shipment.status || '—'} />
          </div>
        ) : (
          <p className="text-xs text-gray-400 px-1">No active shipment</p>
        )}
      </div>
    </div>
  );
};

// ─── Fleet summary list ──────────────────────────────────────────────────────

const FleetSummaryCard = ({ trucks, onSelectTruck }) => {
  if (trucks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <TruckIcon className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No trucks available</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-gray-100">
      {trucks.map(truck => {
        const id = getTruckId(truck);
        const speed = getEffectiveSpeed(truck);
        const isMoving = isTruckMoving(truck);
        const hasSignal = hasLiveSignal(truck);
        const color = STATUS_COLORS[truck.status] || '#9CA3AF';
        return (
          <div
            key={id}
            className="px-3 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => onSelectTruck(truck)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="font-semibold text-sm text-gray-800">{truck.licensePlate || id}</span>
                <EffectiveStatusBadge truck={truck} />
              </div>
              <span className={`text-xs font-bold ${speed !== null ? getSpeedColor(speed) : 'text-gray-400'}`}>
                {speed !== null ? `${speed} km/h` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{truck.brand} {truck.model}</span>
              <span className={`text-xs flex items-center gap-1 ${isMoving ? 'text-teal-600' : 'text-gray-400 italic'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isMoving ? 'bg-teal-500 animate-pulse' : hasSignal ? 'bg-teal-400' : 'bg-gray-300'}`} />
                {isMoving ? 'Moving' : (hasSignal ? 'GPS Active' : 'No Signal')}
              </span>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">
                Seen: {formatDate(getLastUpdateFromTruck(truck))}
              </span>
              {truck.shipment ? (
                <span className="text-xs text-blue-600 flex items-center gap-1">📦 Shipment</span>
              ) : (
                <span className="text-xs text-gray-400">No active shipment</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Mobile Bottom Sheet ─────────────────────────────────────────────────────

const SHEET_SNAP = { PEEK: 'peek', HALF: 'half', FULL: 'full' };

const SHEET_HEIGHT = {
  peek: '72px',
  half: '45vh',
  full: '85vh',
};

const MobileBottomSheet = ({
  trucks, selectedTruck, onSelectTruck, onCloseSelectedTruck,
  updateCount, lastUpdateTime, showRoutePoints, onToggleRoutePoints,
}) => {
  const [snap, setSnap] = useState(SHEET_SNAP.PEEK);

  useEffect(() => {
    if (selectedTruck) setSnap(SHEET_SNAP.HALF);
    else setSnap(SHEET_SNAP.PEEK);
  }, [selectedTruck]);

  const cycleSnap = () => {
    if (snap === SHEET_SNAP.PEEK) setSnap(SHEET_SNAP.HALF);
    else if (snap === SHEET_SNAP.HALF) setSnap(SHEET_SNAP.FULL);
    else setSnap(SHEET_SNAP.PEEK);
  };

  const isOpen = snap !== SHEET_SNAP.PEEK;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[150] bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 flex flex-col"
      style={{
        height: SHEET_HEIGHT[snap],
        transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <div
        className="flex flex-col items-center pt-2 pb-1 cursor-pointer flex-shrink-0"
        onClick={cycleSnap}
      >
        <div className="w-10 h-1 rounded-full bg-gray-300 mb-2" />
        <div className="w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">
              {selectedTruck ? selectedTruck.licensePlate : `${trucks.length} Trucks`}
            </span>
            {selectedTruck && <EffectiveStatusBadge truck={selectedTruck} />}
          </div>
          <div className="flex items-center gap-2">
            {updateCount > 0 && (
              <span className="text-xs text-teal-600 font-medium">{lastUpdateTime}</span>
            )}
            {snap === SHEET_SNAP.FULL
              ? <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              : <ChevronUpIcon className="h-4 w-4 text-gray-400" />
            }
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {selectedTruck ? (
            <TruckDetailsPanel
              truck={selectedTruck}
              onClose={() => { onCloseSelectedTruck(); setSnap(SHEET_SNAP.PEEK); }}
              showRoutePoints={showRoutePoints}
              onToggleRoutePoints={onToggleRoutePoints}
            />
          ) : (
            <>
              {updateCount > 0 && (
                <p className="text-xs text-teal-600 px-4 pb-1">
                  {updateCount} live updates received
                </p>
              )}
              <FleetSummaryCard trucks={trucks} onSelectTruck={onSelectTruck} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

const DesktopSidebar = ({
  trucks, selectedTruck, onSelectTruck, onCloseSelectedTruck,
  updateCount, lastUpdateTime, showRoutePoints, onToggleRoutePoints,
  sidebarOpen, setSidebarOpen, hideOffline, onToggleHideOffline,
}) => {
  const movingCount = trucks.filter(isTruckMoving).length;
  const withGps = trucks.filter(hasLiveSignal).length;

  return (
    <div className={`
      bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 flex-shrink-0
      transition-all duration-300
      ${sidebarOpen ? 'w-96' : 'w-12'}
    `}>
      {sidebarOpen ? (
        <>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-3 z-10 flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Fleet Status</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {trucks.length} trucks · {withGps} with GPS · {movingCount} moving
              </p>
              {updateCount > 0 && (
                <p className="text-xs text-teal-600 mt-1">
                  Updates: {updateCount} | Last: {lastUpdateTime}
                </p>
              )}
              <button
                onClick={onToggleHideOffline}
                className={`mt-2 text-xs px-2 py-1 rounded-full border transition-colors ${
                  hideOffline
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
                title="Toggle visibility of trucks with no live GPS signal"
              >
                {hideOffline ? 'Hiding offline / no GPS' : 'Showing all trucks'}
              </button>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors shrink-0"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {selectedTruck ? (
              <TruckDetailsPanel
                truck={selectedTruck}
                onClose={onCloseSelectedTruck}
                showRoutePoints={showRoutePoints}
                onToggleRoutePoints={onToggleRoutePoints}
              />
            ) : (
              <FleetSummaryCard trucks={trucks} onSelectTruck={onSelectTruck} />
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-4 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-500 rotate-180" />
          </button>
          <div className="text-center">
            <div className="text-xs font-bold text-gray-700">{trucks.length}</div>
            <div className="text-xs text-gray-400">Trucks</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-green-600">{movingCount}</div>
            <div className="text-xs text-gray-400">Moving</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const LiveMap = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Trucks are stored as a Map keyed by truckId instead of an array.
  const [trucksMap, setTrucksMap] = useState(() => new Map());
  const [allowedTruckIds, setAllowedTruckIds] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState({});
  const [currentMapStyle, setCurrentMapStyle] = useState(getSavedMapPreference?.() || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [showRoutePoints, setShowRoutePoints] = useState(false);
  const [hideOffline, setHideOffline] = useState(false);

  const wsInitialized = useRef(false);
  const fitBoundsDone = useRef(false);
  const userInteracted = useRef(false);
  const markerRefs = useRef({});

  useEffect(() => { setMapKey(p => p + 1); }, [currentMapStyle]);

  const trucks = useMemo(() => Array.from(trucksMap.values()), [trucksMap]);

  // Filter out trucks without live signal if hideOffline is true
  const visibleTrucks = useMemo(
    () => (hideOffline ? trucks.filter(hasLiveSignal) : trucks),
    [trucks, hideOffline]
  );

  const visibleTruckIds = useMemo(
    () => new Set(visibleTrucks.map(getTruckId)),
    [visibleTrucks]
  );

  const visibleRoutes = useMemo(() => {
    if (!hideOffline) return routes;
    const filtered = {};
    Object.entries(routes).forEach(([id, pts]) => {
      if (visibleTruckIds.has(id)) filtered[id] = pts;
    });
    return filtered;
  }, [routes, hideOffline, visibleTruckIds]);

  //  fetch allowed trucks using the dedicated manager endpoint
  const fetchAllowedTruckIds = useCallback(async () => {
    try {
      const res = await shipmentService.getMyAssignedShipments();
      const shipments = res.data || [];

      const truckIds = [...new Set(
        shipments
          .filter(s => s.truck)
          .map(s => {
            const truckId = s.truck._id ? s.truck._id.toString() : s.truck.toString();
            return truckId;
          })
      )];
      return truckIds;
    } catch (err) {
      console.error('Failed to fetch manager shipments:', err);
      return [];
    }
  }, []);

  // Filter trucks based on user role
  const filterTrucksByRole = useCallback((allTrucks, allowedIds) => {
    if (!user) return [];
    if (user.role === 'admin') return allTrucks;
    if (!allowedIds || allowedIds.length === 0) return [];
    return allTrucks.filter(truck => allowedIds.includes(getTruckId(truck)));
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await trackingService.getLiveTracking();
        const raw = res.data || [];
        const seen = new Set();
        const uniqueTrucks = raw.filter(t => {
          const id = getTruckId(t);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        let allowedIds = null;
        if (user?.role === 'shipment_manager') {
          allowedIds = await fetchAllowedTruckIds();
          setAllowedTruckIds(allowedIds);
        } else {
          setAllowedTruckIds(null);
        }

        const allowedTrucks = filterTrucksByRole(uniqueTrucks, allowedIds);

        const routeMap = {};
        await Promise.all(allowedTrucks.map(async (truck) => {
          const id = getTruckId(truck);
          const points = await fetchRoutePoints(id, 500);
          if (points.length > 0) routeMap[id] = points;
        }));

        const initialMap = new Map();
        allowedTrucks.forEach(t => initialMap.set(getTruckId(t), t));

        setTrucksMap(initialMap);
        setRoutes(routeMap);
      } catch (err) {
        console.error('Failed to load live trucks:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, fetchAllowedTruckIds, filterTrucksByRole]);

  // WebSocket handler – respects allowed trucks, updates only the affected entry
  const handleTruckLocation = useCallback((data) => {
    const incomingId = data.truckId?.toString();
    if (!incomingId || !hasCoords(data.location)) return;

    if (user?.role === 'shipment_manager') {
      if (!allowedTruckIds || !allowedTruckIds.includes(incomingId)) return;
    }

    setUpdateCount(prev => prev + 1);
    setLastUpdateTime(new Date().toLocaleTimeString());

    setTrucksMap(prev => {
      const existing = prev.get(incomingId);
      if (!existing) return prev; // unknown truck — don't grow the map unexpectedly
      const next = new Map(prev);
      next.set(incomingId, {
        ...existing,
        currentLocation: { lat: Number(data.location.lat), lng: Number(data.location.lng) },
        currentSpeed: Number(data.speed ?? 0),
        status: data.status ?? existing.status,
        lastUpdate: data.timestamp,
        lastTelemetryAt: data.timestamp,
      });
      return next;
    });

    setRoutes(prevRoutes => {
      const newPoint = [data.location.lat, data.location.lng];
      const existing = prevRoutes[incomingId] || [];
      const last = existing[existing.length - 1];
      if (last && last[0] === newPoint[0] && last[1] === newPoint[1]) return prevRoutes;
      return { ...prevRoutes, [incomingId]: [...existing, newPoint].slice(-500) };
    });

    setSelectedTruck(prev => {
      if (!prev || getTruckId(prev) !== incomingId) return prev;
      return {
        ...prev,
        currentLocation: { lat: Number(data.location.lat), lng: Number(data.location.lng) },
        currentSpeed: Number(data.speed ?? 0),
        status: data.status ?? prev.status,
        lastUpdate: data.timestamp,
      };
    });
  }, [user, allowedTruckIds]);

  // WebSocket connection
  useEffect(() => {
    if (wsInitialized.current) return;
    wsInitialized.current = true;
    webSocketService.connect();
  }, []);

  useEffect(() => {
    webSocketService.on('truck_location', handleTruckLocation);
    return () => webSocketService.off('truck_location', handleTruckLocation);
  }, [handleTruckLocation]);

  const handleSelectTruck = useCallback((truck) => {
    setSelectedTruck(truck);
    userInteracted.current = false;
  }, []);

  const handleStyleChange = useCallback((newStyle) => {
    setCurrentMapStyle(newStyle);
    saveMapPreference(newStyle);
  }, []);

  const initialMarkers = useMemo(() =>
    trucks.map(t => getLocationFromTruck(t)).filter(hasCoords),
    [trucks]
  );

  const currentStyle = MAP_STYLES[currentMapStyle] || MAP_STYLES.light;

  if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200 animate-pulse">
        <MapIcon className="h-8 w-8 text-white" />
      </div>
      <p className="text-gray-500 text-sm font-medium animate-pulse">Loading Map...</p>
    </div>
  );
}

  return (
    <div className="flex h-full w-full overflow-hidden flex-col md:flex-row relative z-0">
      {!isMobile && (
        <DesktopSidebar
          trucks={visibleTrucks}
          selectedTruck={selectedTruck}
          onSelectTruck={handleSelectTruck}
          onCloseSelectedTruck={() => setSelectedTruck(null)}
          updateCount={updateCount}
          lastUpdateTime={lastUpdateTime}
          showRoutePoints={showRoutePoints}
          onToggleRoutePoints={() => setShowRoutePoints(v => !v)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          hideOffline={hideOffline}
          onToggleHideOffline={() => setHideOffline(v => !v)}
        />
      )}

      <div className="flex-1 relative z-0" style={{ minHeight: 0 }}>
        <MapStyleSwitcher
          currentStyle={currentMapStyle}
          onStyleChange={handleStyleChange}
          className="absolute top-3 right-3 z-20"
        />

        <MapContainer
          key={mapKey}
          center={[36.8065, 10.1815]}
          zoom={7}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          className={`${currentStyle.className} z-0`}
        >
          <TileLayer
            url={currentStyle.url}
            attribution={currentStyle.attribution}
            maxZoom={currentStyle.maxZoom}
            {...(currentStyle.subdomains ? { subdomains: currentStyle.subdomains } : {})}
          />

          <PanToTruck truck={selectedTruck} />
          <RouteLines routes={visibleRoutes} mapStyle={currentMapStyle} />
          <RoutePointsMarkers routes={visibleRoutes} visible={showRoutePoints} />

          {visibleTrucks.map(truck => {
            const truckId = getTruckId(truck);
            return (
              <TruckMarker
                key={truckId}
                truck={truck}
                isSelected={truckId === getTruckId(selectedTruck)}
                onSelect={handleSelectTruck}
                markerRefs={markerRefs}
              />
            );
          })}

          <LastKnownPositionMarkers trucks={visibleTrucks} routes={visibleRoutes} />
          <ShipmentMarkers trucks={visibleTrucks} />
          <FitBounds markers={initialMarkers} done={fitBoundsDone} />
        </MapContainer>
      </div>

      {isMobile && (
        <MobileBottomSheet
          trucks={trucks}
          selectedTruck={selectedTruck}
          onSelectTruck={handleSelectTruck}
          onCloseSelectedTruck={() => setSelectedTruck(null)}
          updateCount={updateCount}
          lastUpdateTime={lastUpdateTime}
          showRoutePoints={showRoutePoints}
          onToggleRoutePoints={() => setShowRoutePoints(v => !v)}
        />
      )}
    </div>
  );
};

export default LiveMap;