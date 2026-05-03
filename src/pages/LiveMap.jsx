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
import {
  TruckIcon, ClockIcon, MapPinIcon, ChevronRightIcon,
  BoltIcon, XMarkIcon, GlobeAltIcon, SignalIcon,
  MapIcon
} from '@heroicons/react/24/outline';

// ---------- Fix Leaflet default icon ----------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  !(obj.lat === 0 && obj.lng === 0)

const getLocationFromTruck = (truck) => {
  const loc = truck?.currentLocation;
  if (!loc) return null;
  
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  
  // Treat 0,0 as no location (default unset value)
  if (lat === 0 && lng === 0) return null;

  return { lat, lng };
};

const getSpeedFromTruck = (truck) =>
  truck?.currentSpeed || truck?.speed || truck?.trip?.currentSpeed || 0;

const getLastUpdateFromTruck = (truck) =>
  truck?.lastUpdate || truck?.lastTelemetryAt || truck?.updatedAt || new Date().toISOString();

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

// ─── Truck icon (receives full truck object) ─────────────────────────────────

const STATUS_COLORS = {
  in_mission: '#3B82F6',
  available: '#6B7280',
  maintenance: '#F59E0B',
};

const createTruckIcon = (truck, isSelected = false) => {
  const color = STATUS_COLORS[truck?.status] || '#6B7280';
  const speed = getSpeedFromTruck(truck);
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
          background:${speed > 0 ? color : '#9CA3AF'};
          color:white;
          font-size:9px;
          font-weight:700;
          padding:2px 5px;
          border-radius:8px;
          box-shadow:0 1px 4px rgba(0,0,0,0.25);
          white-space:nowrap;
          letter-spacing:0.3px;
        ">${speed} km/h</div>
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

// ─── Route lines ─────────────────────────────────────────────────────────────

const RouteLines = ({ routes, mapStyle }) => {
  const routeColors = getRouteColor(mapStyle);
  return (
    <>
      {Object.entries(routes).map(([truckId, points]) => {
        if (!points || points.length < 2) return null;
        return (
          <Polyline
            key={`${truckId}-${mapStyle}`}
            positions={points}
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

  // Small semi-transparent circle icon for each historical point
  const pointIcon = L.divIcon({
    html: `<div style="background:#3B82F6; width:6px; height:6px; border-radius:50%; border:1px solid white; opacity:0.7;"></div>`,
    className: '',
    iconSize: [6, 6],
    iconAnchor: [3, 3],
  });

  return (
    <>
      {Object.entries(routes).map(([truckId, points]) => {
        if (!points || points.length === 0) return null;
        return points.map((point, idx) => (
          <Marker
            key={`${truckId}-point-${idx}`}
            position={[point[0], point[1]]}
            icon={pointIcon}
            // Optional: add a popup with order index and timestamp
            // interactive={false}  // uncomment to make them non-clickable
          >
            <Popup>
              <span className="text-xs">Point #{idx + 1}<br/>{point[0].toFixed(5)}, {point[1].toFixed(5)}</span>
            </Popup>
          </Marker>
        ));
      })}
    </>
  );
};
// ─── Shipment origin/destination markers ────────────────────────────────────

const ShipmentMarkers = ({ trucks }) => {
  const startIcon = L.divIcon({
    html: `<div style="background:#10B981;width:18px;height:18px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: '',
    iconSize: [18, 18],
    popupAnchor: [0, -10],
  });
  const endIcon = L.divIcon({
    html: `<div style="background:#EF4444;width:18px;height:18px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: '',
    iconSize: [18, 18],
    popupAnchor: [0, -10],
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

// ─── Fit bounds on first load ────────────────────────────────────────────────

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

// ─── Sidebar helpers ─────────────────────────────────────────────────────────

const STATUS_BADGE = {
  in_mission: 'bg-blue-100 text-blue-800',
  on_road: 'bg-green-100 text-green-800',
  available: 'bg-gray-100 text-gray-700',
  maintenance: 'bg-yellow-100 text-yellow-800',
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-700'}`}>
    {getStatusText(status)}
  </span>
);

const getSpeedColor = (speed) => {
  if (!speed || speed === 0) return 'text-gray-400';
  if (speed < 60) return 'text-emerald-600';
  if (speed < 90) return 'text-amber-500';
  return 'text-red-500';
};

// ─── Live location card (always visible when truck selected) ─────────────────

const LiveLocationCard = ({ truck }) => {
  const location = getLocationFromTruck(truck);
  const speed = getSpeedFromTruck(truck);
  const lastUpdate = getLastUpdateFromTruck(truck);
  const [locationName, setLocationName] = useState('Locating…');
  const prevLocRef = useRef(null);

  // Re-geocode only when coordinates actually change
  useEffect(() => {
    if (!location) return;
    const key = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
    if (prevLocRef.current === key) return;
    prevLocRef.current = key;
    setLocationName('Locating…');
    getLocationName(location.lat, location.lng).then(setLocationName);
  }, [location]);

  const isMoving = speed > 0;

  return (
    <div className="mx-3 mb-3 rounded-xl overflow-hidden border border-blue-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isMoving ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-white text-xs font-semibold tracking-wide">
            {isMoving ? 'LIVE · MOVING' : 'LIVE · STOPPED'}
          </span>
        </div>
        <span className="text-blue-100 text-xs">{formatDate(lastUpdate)}</span>
      </div>

      {/* Body */}
      <div className="bg-white px-3 py-2 space-y-2">
        {location ? (
          <>
            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-gray-800 leading-snug">{locationName}</p>
            </div>

            {/* Coordinates */}
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

            {/* Speed */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <BoltIcon className={`h-4 w-4 ${getSpeedColor(speed)}`} />
                <span className="text-xs text-gray-500">Speed</span>
              </div>
              <span className={`text-sm font-bold ${getSpeedColor(speed)}`}>{speed} km/h</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 py-2 text-gray-400">
            <SignalIcon className="h-4 w-4" />
            <span className="text-xs">No GPS signal</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Truck details panel (Follow feature removed) ───────────────────────────

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
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: STATUS_COLORS[truck.status] || '#9CA3AF' }}
          />
          <span className="text-sm font-bold text-gray-800">{truck.licensePlate}</span>
          <StatusBadge status={truck.status} />
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

        {truck.shipment && (
          <div className="bg-blue-50 rounded-xl p-3 space-y-1 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Active Shipment</p>
            <Row label="Origin" value={truck.shipment.origin || '—'} />
            <Row label="Destination" value={truck.shipment.destination || '—'} />
            <Row label="Status" value={truck.shipment.status || '—'} />
          </div>
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
        const speed = getSpeedFromTruck(truck);
        const location = getLocationFromTruck(truck);
        const isMoving = speed > 0;
        const color = STATUS_COLORS[truck.status] || '#9CA3AF';

        return (
          <div
            key={id}
            className="px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSelectTruck(truck)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="font-semibold text-sm text-gray-800">{truck.licensePlate || id}</span>
                <StatusBadge status={truck.status} />
              </div>
              <span className={`text-xs font-bold ${getSpeedColor(speed)}`}>{speed} km/h</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{truck.brand} {truck.model}</span>
              <span className={`text-xs flex items-center gap-1 ${location ? 'text-green-600' : 'text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${location && isMoving ? 'bg-green-500 animate-pulse' : location ? 'bg-green-400' : 'bg-gray-300'}`} />
              {location ? (isMoving ? 'Moving' : 'GPS Active') : 'GPS not available yet'}
            </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── One-time pan to selected truck (no follow) ─────────────────────────────

const PanToTruck = ({ truck }) => {
  const map = useMap();
  const prevTruckId = useRef();

  useEffect(() => {
    if (!truck) return;
    const location = getLocationFromTruck(truck);
    if (!location) return;
    const truckId = getTruckId(truck);
    // Only pan when a different truck is selected
    if (prevTruckId.current === truckId) return;
    prevTruckId.current = truckId;

    map.flyTo([location.lat, location.lng], map.getZoom(), {
      animate: true,
      duration: 0.8,
    });
  }, [truck, map]);

  return null;
};

// ─── Main component ──────────────────────────────────────────────────────────

const LiveMap = () => {
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState({});
  const [currentMapStyle, setCurrentMapStyle] = useState(getSavedMapPreference?.() || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [markerUpdateTrigger, setMarkerUpdateTrigger] = useState(0);

  const wsInitialized = useRef(false);
  const fitBoundsDone = useRef(false);
  const userInteracted = useRef(false);
  const markerRefs = useRef({});
  const [showRoutePoints, setShowRoutePoints] = useState(false);

  // Re-render map when style changes
  useEffect(() => { setMapKey(p => p + 1); }, [currentMapStyle]);

  // Handle truck location updates
  const handleTruckLocation = useCallback((data) => {
    console.log("📡 WS RAW DATA RECEIVED:", data);

    const incomingId = data.truckId?.toString();
    if (!incomingId || !hasCoords(data.location)) {
      console.warn('⚠️ Invalid WS payload:', data);
      return;
    }

    setUpdateCount(prev => prev + 1);
    setLastUpdateTime(new Date().toLocaleTimeString());

    // Force marker re-render
    setMarkerUpdateTrigger(prev => prev + 1);

    // Update trucks state
    setTrucks(prevTrucks => {
      const truckExists = prevTrucks.some(truck => getTruckId(truck) === incomingId);

      if (!truckExists) {
        console.warn(`⚠️ Truck ${incomingId} not found in current trucks list`);
        return prevTrucks;
      }

      const updated = prevTrucks.map(truck => {
        if (getTruckId(truck) !== incomingId) return truck;

        const updatedTruck = {
          ...truck,
          currentLocation: {
            lat: Number(data.location.lat),
            lng: Number(data.location.lng),
          },
          currentSpeed: Number(data.speed ?? 0),
          status: data.status ?? truck.status,
          lastUpdate: data.timestamp,
          lastTelemetryAt: data.timestamp,
        };

        console.log(`Updated truck ${incomingId} to:`, updatedTruck.currentLocation);
        return updatedTruck;
      });

      return updated;
    });

    // Directly update marker if ref exists
    if (markerRefs.current[incomingId]) {
      const marker = markerRefs.current[incomingId];
      if (marker && marker.setLatLng) {
        marker.setLatLng([data.location.lat, data.location.lng]);
        console.log(`Direct marker update for ${incomingId}`);
      }
    }

    // Update route trail
    setRoutes(prevRoutes => {
      const newPoint = [data.location.lat, data.location.lng];
      const existing = prevRoutes[incomingId] || [];
      const last = existing[existing.length - 1];

      if (last && last[0] === newPoint[0] && last[1] === newPoint[1]) {
        return prevRoutes;
      }

      const updatedRoutes = {
        ...prevRoutes,
        [incomingId]: [...existing, newPoint].slice(-500)
      };

      return updatedRoutes;
    });

    // Update selected truck if needed
    if (selectedTruck && getTruckId(selectedTruck) === incomingId) {
      setSelectedTruck(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentLocation: {
            lat: Number(data.location.lat),
            lng: Number(data.location.lng),
          },
          currentSpeed: Number(data.speed ?? 0),
          status: data.status ?? prev.status,
          lastUpdate: data.timestamp,
        };
      });
    }
  }, [selectedTruck]);

  // WebSocket setup
  useEffect(() => {
    if (wsInitialized.current) return;
    wsInitialized.current = true;
    webSocketService.connect();
  }, []);
  useEffect(() => {
    webSocketService.on('truck_location', handleTruckLocation);
    return () => {
      webSocketService.off('truck_location', handleTruckLocation);
    };
  }, [handleTruckLocation]);

  // Log truck state changes for debugging
  useEffect(() => {
    if (trucks.length > 0) {
      console.log("Trucks state updated:", trucks.map(t => ({
        id: getTruckId(t),
        location: getLocationFromTruck(t),
        speed: getSpeedFromTruck(t)
      })));
    }
  }, [trucks]);

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

        const routeMap = {};
        await Promise.all(
          uniqueTrucks.map(async (truck) => {
            const id = getTruckId(truck);
            const points = await fetchRoutePoints(id, 500);
            if (points.length > 0) routeMap[id] = points;
          })
        );

        setTrucks(uniqueTrucks);
        setRoutes(routeMap);
      } catch (err) {
        console.error('Failed to load live trucks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectTruck = useCallback((truck) => {
    setSelectedTruck(truck);
    userInteracted.current = false;
  }, []);

  const handleStyleChange = useCallback((newStyle) => {
    setCurrentMapStyle(newStyle);
    saveMapPreference(newStyle);
  }, []);

  const initialMarkers = useMemo(() =>
    trucks
      .map(t => getLocationFromTruck(t))
      .filter(hasCoords)
    , [trucks]);

  const currentStyle = MAP_STYLES[currentMapStyle] || MAP_STYLES.light;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white-500 flex items-center justify-center shadow-lg animate-pulse">
          <MapIcon className="h-8 w-8 text-gray" />
        </div>
        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading Map</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className={`
        bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 flex-shrink-0
        transition-all duration-300
        ${sidebarOpen ? 'w-96' : 'w-12'}
      `}>
        {sidebarOpen ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-3 z-10 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Fleet Status</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {trucks.length} trucks ·{' '}
                  {trucks.filter(t => getLocationFromTruck(t)).length} with GPS ·{' '}
                  {trucks.filter(t => getSpeedFromTruck(t) > 0).length} moving
                </p>
                {updateCount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Updates: {updateCount} | Last: {lastUpdateTime}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {selectedTruck ? (
                <TruckDetailsPanel
                  truck={selectedTruck}
                  onClose={() => setSelectedTruck(null)}
                />
              ) : (
                <FleetSummaryCard trucks={trucks} onSelectTruck={handleSelectTruck} />
              )}
            </div>
          </>
        ) : (
          /* Collapsed sidebar */
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
              <div className="text-xs font-bold text-green-600">
                {trucks.filter(t => getSpeedFromTruck(t) > 0).length}
              </div>
              <div className="text-xs text-gray-400">Moving</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapStyleSwitcher
          currentStyle={currentMapStyle}
          onStyleChange={handleStyleChange}
          className="absolute top-3 right-3 z-[400]"
        />

        <MapContainer
          key={mapKey}
          center={[36.8065, 10.1815]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          className={currentStyle.className}
          whenReady={() => console.log('Map ready!')}
        >
          <TileLayer
            url={currentStyle.url}
            attribution={currentStyle.attribution}
            maxZoom={currentStyle.maxZoom}
            {...(currentStyle.subdomains ? { subdomains: currentStyle.subdomains } : {})}
          />

          {/* One-time pan to selected truck */}
          <PanToTruck truck={selectedTruck} />

          {/* Route trails */}
          <RouteLines routes={routes} mapStyle={currentMapStyle} />
<RoutePointsMarkers routes={routes} visible={showRoutePoints} />
          {/* Truck markers */}
          {trucks.map(truck => {
            const loc = getLocationFromTruck(truck);
            const isSelected = getTruckId(truck) === getTruckId(selectedTruck);
            if (!hasCoords(loc)) return null;
            
            const truckId = getTruckId(truck);
            const markerKey = `${truckId}-${loc.lat.toFixed(8)}-${loc.lng.toFixed(8)}-${markerUpdateTrigger}`;
            
            return (
              <Marker
                key={markerKey}
                position={[loc.lat, loc.lng]}
                icon={createTruckIcon(truck, isSelected)}
                ref={(ref) => {
                  if (ref && truckId) {
                    markerRefs.current[truckId] = ref;
                  }
                }}
                zIndexOffset={isSelected ? 1000 : 0}
                eventHandlers={{
                  click: () => {
                    handleSelectTruck(truck);
                    userInteracted.current = false;
                  }
                }}
              >
                <Popup>
                  <div className="space-y-1 text-sm min-w-[160px]">
                    <div className="font-bold text-gray-800">🚛 {truck.licensePlate || 'Unknown'}</div>
                    <div className="text-gray-500 text-xs">{truck.brand} {truck.model}</div>
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                      <span className="text-gray-400">Speed</span>
                      <span className={`font-semibold ${getSpeedColor(getSpeedFromTruck(truck))}`}>
                        {getSpeedFromTruck(truck)} km/h
                      </span>
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
          })}

          {/* Shipment origin/destination pins */}
          <ShipmentMarkers trucks={trucks} />

          {/* Fit map to all trucks on first load */}
          <FitBounds markers={initialMarkers} done={fitBoundsDone} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveMap;