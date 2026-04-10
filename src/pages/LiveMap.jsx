import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackingService } from '../services/trackingService';
import { mapMarkers, getStatusText } from '../constants/colors';
import webSocketService from '../services/websocket';
import {
  TruckIcon, UserIcon, CubeIcon, ClockIcon, MapPinIcon,
  PhoneIcon, ScaleIcon, CalendarIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

// Helper to create a simple marker icon (for origin/destination)
const createSimpleMarker = (color) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-simple-marker',
    iconSize: [24, 24],
    popupAnchor: [0, -12]
  });
};

const getRouteColor = (status) => {
  switch (status) {
    case 'on_road': return '#10B981';
    case 'in_mission': return '#3B82F6';
    case 'available': return '#6B7280';
    case 'maintenance': return '#F59E0B';
    default: return '#3B82F6';
  }
};

const createTruckIcon = (status) => {
  const color = mapMarkers[status] || '#6B7280';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 20px;">🚛</div>`,
    className: 'custom-truck-marker',
    iconSize: [36, 36],
    popupAnchor: [0, -18]
  });
};

const FitBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [markers, map]);
  return null;
};

const fetchRoute = async (truckId, limit = 500) => {
  try {
    const res = await trackingService.getTruckLocations(truckId, { limit });
    const points = res.data.map(loc => {
      const [lng, lat] = loc.location.coordinates;
      return [lat, lng];
    });
    return points;
  } catch (err) {
    console.error(`Failed to fetch route for truck ${truckId}:`, err);
    return [];
  }
};

const LiveMap = () => {
  const [trucks, setTrucks] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState({});

  // Fetch initial trucks and their routes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await trackingService.getLiveTracking();
        const trucksData = res.data;
        setTrucks(trucksData);
        const routeMap = {};
        for (const truck of trucksData) {
          const points = await fetchRoute(truck.id, 500);
          routeMap[truck.id] = points;
        }
        setRoutes(routeMap);
      } catch (err) {
        console.error('Failed to load live trucks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    webSocketService.connect();

    const handleTruckLocation = (data) => {
      console.log('📡 Received:', data);
      setTrucks(prev => {
        const idx = prev.findIndex(t => t.id === data.truckId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          currentLocation: data.location,
          currentSpeed: data.speed,
          lastUpdate: data.timestamp,
          isOnline: true
        };
        return updated;
      });
      setRoutes(prevRoutes => {
        const oldPoints = prevRoutes[data.truckId] || [];
        const newPoint = [data.location.lat, data.location.lng];
        if (oldPoints.length && oldPoints[oldPoints.length-1][0] === newPoint[0] && oldPoints[oldPoints.length-1][1] === newPoint[1]) {
          return prevRoutes;
        }
        return { ...prevRoutes, [data.truckId]: [...oldPoints, newPoint] };
      });
      if (selectedTruck && selectedTruck.id === data.truckId) {
        setSelectedTruck(prev => ({ ...prev, ...data }));
      }
    };

    // ✅ Listen to mission_completed to clear the route
    const handleMissionCompleted = (data) => {
      console.log('✅ Mission completed, clearing route for truck:', data.truckId);
      setRoutes(prevRoutes => {
        const newRoutes = { ...prevRoutes };
        delete newRoutes[data.truckId];
        return newRoutes;
      });
      // Also optionally refetch trucks to get updated shipment status
      // (the truck will no longer have an active shipment)
    };

    webSocketService.on('truck_location', handleTruckLocation);
    webSocketService.on('mission_completed', handleMissionCompleted);

    return () => {
      webSocketService.off('truck_location', handleTruckLocation);
      webSocketService.off('mission_completed', handleMissionCompleted);
    };
  }, [selectedTruck]);

  const markers = trucks
    .filter(t => t.currentLocation?.lat && t.currentLocation?.lng)
    .map(t => ({ lat: t.currentLocation.lat, lng: t.currentLocation.lng }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      {/* LEFT SIDEBAR (unchanged) */}
      <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto shadow-lg z-10 flex-shrink-0">
        {selectedTruck ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Truck Details</h2>
              <button onClick={() => setSelectedTruck(null)} className="p-1 rounded-full hover:bg-gray-100">✖</button>
            </div>
            {/* ... existing truck info ... */}
            <div className="border-b pb-3 mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-bold">{selectedTruck.licensePlate}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedTruck.brand} {selectedTruck.model}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTruck.status === 'on_road' || selectedTruck.status === 'in_mission'
                    ? 'bg-green-100 text-green-800'
                    : selectedTruck.status === 'available'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusText(selectedTruck.status)}
                </span>
              </div>
              {selectedTruck.currentSpeed !== undefined && (
                <p className="text-sm text-gray-600 mt-2">🚀 Speed: <span className="font-medium">{selectedTruck.currentSpeed} km/h</span></p>
              )}
              {selectedTruck.driver && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="h-4 w-4" />
                  <span>{selectedTruck.driver.name}</span>
                  {selectedTruck.driver.phone && (
                    <>
                      <span className="text-gray-300">|</span>
                      <PhoneIcon className="h-4 w-4" />
                      <span>{selectedTruck.driver.phone}</span>
                    </>
                  )}
                </div>
              )}
              {selectedTruck.lastUpdate && (
                <p className="text-xs text-gray-400 mt-2">Last update: {new Date(selectedTruck.lastUpdate).toLocaleString()}</p>
              )}
            </div>

            {/* Current Shipment Details (same as before) */}
            {selectedTruck.shipment ? (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                    <CubeIcon className="h-5 w-5 text-blue-500" />
                    Current Shipment
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-gray-500">
                        {selectedTruck.shipment.shipmentId || selectedTruck.shipment.id?.slice(-8)}
                      </span>
                      {selectedTruck.shipment.priority && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Priority</span>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Origin</p>
                        <p className="text-sm text-gray-800">{selectedTruck.shipment.origin}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Destination</p>
                        <p className="text-sm text-gray-800">{selectedTruck.shipment.destination}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <ScaleIcon className="h-4 w-4 text-gray-400" />
                        {selectedTruck.shipment.weight} kg
                      </span>
                      <span className="capitalize">Type: {selectedTruck.shipment.type}</span>
                    </div>
                    {selectedTruck.shipment.customer && (
                      <div className="pt-1">
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium">{selectedTruck.shipment.customer.name}</p>
                        {selectedTruck.shipment.customer.phone && (
                          <p className="text-xs text-gray-500">{selectedTruck.shipment.customer.phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Loading Status & Trip Metrics (unchanged) */}
                {selectedTruck.loading && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                      <ClockIcon className="h-5 w-5 text-yellow-500" />
                      Loading Status
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                      {selectedTruck.loading.startedAt && <p>Started: {new Date(selectedTruck.loading.startedAt).toLocaleString()}</p>}
                      {selectedTruck.loading.completedAt && <p>Completed: {new Date(selectedTruck.loading.completedAt).toLocaleString()}</p>}
                      {selectedTruck.loading.actualDurationMinutes !== undefined && <p>Actual duration: {selectedTruck.loading.actualDurationMinutes.toFixed(1)} min</p>}
                      {selectedTruck.loading.plannedDurationMinutes && <p>Planned: {selectedTruck.loading.plannedDurationMinutes} min</p>}
                    </div>
                  </div>
                )}

                {selectedTruck.trip && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                      <ArrowPathIcon className="h-5 w-5 text-purple-500" />
                      Trip Metrics
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                      {selectedTruck.trip.distanceCovered && <p>Distance: {selectedTruck.trip.distanceCovered.toFixed(1)} km</p>}
                      {selectedTruck.trip.avgSpeed && <p>Avg speed: {selectedTruck.trip.avgSpeed.toFixed(1)} km/h</p>}
                      {selectedTruck.trip.maxSpeed && <p>Max speed: {selectedTruck.trip.maxSpeed} km/h</p>}
                      <p>Mission status: {selectedTruck.trip.status || selectedTruck.missionStatus}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <TruckIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No active shipment for this truck</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <p>Click on any truck marker to see details</p>
          </div>
        )}
      </div>

      {/* RIGHT MAP */}
      <div className="flex-1 relative">
        <MapContainer center={[36.8065, 10.1815]} zoom={7} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          
          {/* Polylines (routes) */}
          {Object.entries(routes).map(([truckId, points]) => {
            if (points.length < 2) return null;
            const truck = trucks.find(t => t.id === truckId);
            const color = truck ? getRouteColor(truck.status) : '#3B82F6';
            return <Polyline key={truckId} positions={points} color={color} weight={3} opacity={0.7} smoothFactor={1} />;
          })}
          
          {/* Truck markers */}
          {trucks.map(truck => (
            truck.currentLocation?.lat && truck.currentLocation?.lng && (
              <Marker
                key={truck.id}
                position={[truck.currentLocation.lat, truck.currentLocation.lng]}
                icon={createTruckIcon(truck.status)}
                eventHandlers={{ click: () => setSelectedTruck(truck) }}
              />
            )
          ))}
          
          {/* ✅ Origin and Destination markers for each truck with active shipment */}
          {trucks.map(truck => {
            if (!truck.shipment) return null;
            const origin = truck.shipment.originCoordinates;
            const destination = truck.shipment.destinationCoordinates;
            const markersToShow = [];
            if (origin && origin.lat && origin.lng) {
              markersToShow.push(
                <Marker
                  key={`${truck.id}-origin`}
                  position={[origin.lat, origin.lng]}
                  icon={createSimpleMarker('#10B981')}
                />
              );
            }
            if (destination && destination.lat && destination.lng) {
              markersToShow.push(
                <Marker
                  key={`${truck.id}-dest`}
                  position={[destination.lat, destination.lng]}
                  icon={createSimpleMarker('#EF4444')}
                />
              );
            }
            return markersToShow;
          })}
          
          <FitBounds markers={markers} />
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveMap;