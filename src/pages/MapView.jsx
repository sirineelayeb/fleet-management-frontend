import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { shipmentService } from '../services/shipmentService';
import { truckService } from '../services/truckService';
import { 
  TruckIcon, 
  LocationMarkerIcon, 
  UserIcon, 
  CubeIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom truck icon
const createTruckIcon = (status, isSelected = false) => {
  const isOnRoad = status === 'on_road' || status === 'active';
  const color = isOnRoad ? '#10B981' : '#3B82F6';
  const size = isSelected ? 44 : 36;
  
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        cursor: pointer;
        ${isSelected ? 'transform: scale(1.15); box-shadow: 0 0 0 4px rgba(59,130,246,0.4);' : ''}
      ">
        <svg width="${size/2.2}" height="${size/2.2}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5">
          <rect x="4" y="8" width="16" height="10" rx="1" fill="white" stroke="white"/>
          <circle cx="8" cy="18" r="2" fill="white" stroke="white"/>
          <circle cx="16" cy="18" r="2" fill="white" stroke="white"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    popupAnchor: [0, -size/2]
  });
};

const MapView = () => {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef({});

  // Fetch all trucks
  const { data: trucksData, isLoading: trucksLoading, refetch: refetchTrucks } = useQuery({
    queryKey: ['allTrucks'],
    queryFn: async () => {
      const response = await truckService.getAll();
      console.log('Truck API Response:', response);
      return response;
    },
    refetchInterval: 30000,
  });

  // Extract trucks array from response
  const trucks = trucksData?.data || trucksData || [];

  // Fetch all shipments to get details
  const { data: shipmentsData, refetch: refetchShipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentService.getAll().then(res => res.data),
    refetchInterval: 30000,
  });

  const shipments = shipmentsData?.data || shipmentsData || [];

  // Debug: Log trucks data
  useEffect(() => {
    console.log('Raw trucksData:', trucksData);
    console.log('Extracted trucks array:', trucks);
    console.log('Trucks with on_road or active status:', 
      trucks.filter(t => t.status === 'on_road' || t.status === 'active')
    );
  }, [trucksData, trucks]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([36.8065, 10.1815], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    L.control.scale().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add truck markers to map
  useEffect(() => {
    if (!mapRef.current || !trucks || trucks.length === 0) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker) mapRef.current.removeLayer(marker);
    });
    markersRef.current = {};

    // Filter trucks on road (status 'on_road' or 'active')
    const trucksOnRoad = trucks.filter(truck => 
      truck.status === 'on_road' || truck.status === 'active'
    );

    console.log('Trucks to display on map:', trucksOnRoad.length);

    // Add markers for each truck on road
    trucksOnRoad.forEach((truck) => {
      if (truck.currentLocation?.coordinates?.length === 2) {
        const [lng, lat] = truck.currentLocation.coordinates;
        const isSelected = selectedTruck?._id === truck._id;
        
        const marker = L.marker([lat, lng], {
          icon: createTruckIcon(truck.status, isSelected)
        }).addTo(mapRef.current);

        // Popup with truck info
        const shipment = getCurrentShipment(truck._id);
        const popupContent = `
          <div class="p-3 min-w-[250px]">
            <div class="font-bold text-lg mb-2">🚛 ${truck.licensePlate}</div>
            <div class="space-y-1 text-sm">
              <div><span class="font-semibold">Model:</span> ${truck.brand} ${truck.model}</div>
              <div><span class="font-semibold">Status:</span> 
                <span class="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                  On Road
                </span>
              </div>
              ${truck.currentSpeed ? `<div><span class="font-semibold">Speed:</span> ${truck.currentSpeed} km/h</div>` : ''}
              ${truck.driver ? `<div><span class="font-semibold">Driver:</span> ${truck.driver.firstName} ${truck.driver.lastName}</div>` : ''}
              ${shipment ? `<div class="mt-2 pt-2 border-t"><span class="font-semibold">Current Shipment:</span><br/>${shipment.shipmentNumber}</div>` : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => setSelectedTruck(truck));
        
        markersRef.current[truck._id] = marker;
      } else {
        console.log('Truck missing coordinates:', truck.licensePlate, truck.currentLocation);
      }
    });

    // Fit bounds to show all trucks on road
    const truckLocations = trucksOnRoad
      .filter(t => t.currentLocation?.coordinates)
      .map(t => {
        const [lng, lat] = t.currentLocation.coordinates;
        return [lat, lng];
      });
    
    if (truckLocations.length > 0) {
      const bounds = L.latLngBounds(truckLocations);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trucks, selectedTruck, shipments]);

  // Get current shipment for a truck
  const getCurrentShipment = (truckId) => {
    if (!shipments || shipments.length === 0) return null;
    return shipments.find(s => 
      s.truck?._id === truckId && 
      (s.status === 'in_transit' || s.status === 'pending')
    );
  };

  const handleRefresh = () => {
    refetchTrucks();
    refetchShipments();
    setLastRefresh(new Date());
  };

  if (trucksLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter trucks on road (status 'on_road' or 'active')
  const trucksOnRoad = trucks.filter(t => 
    t.status === 'on_road' || t.status === 'active'
  );
  
  const trucksAvailable = trucks.filter(t => 
    t.status === 'available'
  );

  console.log('Trucks on road count:', trucksOnRoad.length);
  console.log('Trucks available count:', trucksAvailable.length);
  console.log('All trucks:', trucks);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Fleet Tracking</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time GPS positions of trucks on road with their current shipments
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">On Road ({trucksOnRoad.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Available ({trucksAvailable.length})</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Refresh</span>
            </button>
            <p className="text-xs text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex relative">
        {/* Left Sidebar - Trucks on Road with Shipments */}
        <div className={`bg-gray-50 border-r transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-96' : 'w-0'
        } overflow-hidden`}>
          <div className="p-4 border-b bg-white">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Trucks On Road ({trucksOnRoad.length})
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Active trucks with their current shipments
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {trucksOnRoad.length === 0 ? (
              <div className="text-center py-12">
                <TruckIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No trucks on road at the moment</p>
                <p className="text-xs text-gray-400 mt-2">Check truck status in database</p>
              </div>
            ) : (
              trucksOnRoad.map((truck) => {
                const shipment = getCurrentShipment(truck._id);
                return (
                  <div
                    key={truck._id}
                    onClick={() => setSelectedTruck(truck)}
                    className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                      selectedTruck?._id === truck._id ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    {/* Truck Header */}
                    <div className="p-4 border-b bg-gradient-to-r from-green-50 to-white">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-green-100">
                            <TruckIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{truck.licensePlate}</h3>
                            <p className="text-xs text-gray-500">{truck.brand} {truck.model}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          On Road
                        </span>
                      </div>
                      
                      {/* Driver Info */}
                      {truck.driver && (
                        <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                          <UserIcon className="h-4 w-4" />
                          <span>{truck.driver.firstName} {truck.driver.lastName}</span>
                          {truck.driver.phone && (
                            <>
                              <span className="text-gray-300">|</span>
                              <PhoneIcon className="h-4 w-4" />
                              <span>{truck.driver.phone}</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Speed */}
                      {truck.currentSpeed !== undefined && (
                        <div className="mt-2 text-sm text-gray-600">
                          🚀 Speed: <span className="font-medium">{truck.currentSpeed} km/h</span>
                        </div>
                      )}
                    </div>

                    {/* Current Shipment Details */}
                    {shipment ? (
                      <div className="p-4 bg-blue-50">
                        <div className="flex items-center space-x-2 mb-3">
                          <CubeIcon className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">Current Shipment</h4>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            {shipment.shipmentNumber}
                          </span>
                        </div>

                        {/* Customer */}
                        <div className="mb-3 p-2 bg-white rounded-lg">
                          <div className="flex items-center space-x-2 text-sm">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">{shipment.customer?.name}</span>
                          </div>
                          {shipment.customer?.phone && (
                            <div className="text-xs text-gray-500 mt-1 ml-6">
                              📞 {shipment.customer.phone}
                            </div>
                          )}
                        </div>

                        {/* Route */}
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <LocationMarkerIcon className="h-4 w-4 text-green-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Origin</p>
                              <p className="text-sm text-gray-700">{shipment.origin?.address}</p>
                              {shipment.origin?.city && (
                                <p className="text-xs text-gray-400">{shipment.origin.city}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPinIcon className="h-4 w-4 text-red-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Destination</p>
                              <p className="text-sm text-gray-700">{shipment.destination?.address}</p>
                              {shipment.destination?.city && (
                                <p className="text-xs text-gray-400">{shipment.destination.city}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Estimated Arrival */}
                        {shipment.estimatedArrival && (
                          <div className="mt-3 pt-2 border-t flex items-center space-x-2 text-sm">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Est. Arrival:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(shipment.estimatedArrival).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Goods Summary */}
                        {shipment.goods && shipment.goods.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <CubeIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-xs font-medium text-gray-600">Goods ({shipment.goods.length})</span>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {shipment.goods.slice(0, 3).map((good, idx) => (
                                <div key={idx} className="text-xs text-gray-600 flex justify-between">
                                  <span>{good.name}</span>
                                  <span>{good.quantity} {good.unit}</span>
                                </div>
                              ))}
                              {shipment.goods.length > 3 && (
                                <p className="text-xs text-blue-600">+{shipment.goods.length - 3} more items</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <TruckIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No active shipment</p>
                        <p className="text-xs">Truck is en route but no shipment data</p>
                      </div>
                    )}

                    {/* Location Info */}
                    {truck.currentLocation?.coordinates && (
                      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
                        📍 Location: {truck.currentLocation.coordinates[1].toFixed(6)}°, {truck.currentLocation.coordinates[0].toFixed(6)}°
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-r-lg shadow-md p-2 z-10 hover:bg-gray-50"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* Map Container - Right Side */}
        <div ref={mapContainerRef} className="flex-1 h-full" />

        {/* Selected Truck Info Panel - Bottom Right */}
        {selectedTruck && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-[280px] z-10">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">Selected Truck</h3>
              <button
                onClick={() => setSelectedTruck(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TruckIcon className="h-5 w-5 text-green-600" />
                <span className="font-bold text-gray-900">{selectedTruck.licensePlate}</span>
              </div>
              <p className="text-sm text-gray-600">{selectedTruck.brand} {selectedTruck.model}</p>
              {selectedTruck.currentSpeed !== undefined && (
                <p className="text-sm text-gray-600">Speed: <span className="font-medium">{selectedTruck.currentSpeed} km/h</span></p>
              )}
              {selectedTruck.driver && (
                <p className="text-sm text-gray-600">Driver: {selectedTruck.driver.firstName} {selectedTruck.driver.lastName}</p>
              )}
              {selectedTruck.currentLocation?.coordinates && (
                <p className="text-xs text-gray-400">
                  📍 Lat: {selectedTruck.currentLocation.coordinates[1].toFixed(6)}<br/>
                  📍 Lng: {selectedTruck.currentLocation.coordinates[0].toFixed(6)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
