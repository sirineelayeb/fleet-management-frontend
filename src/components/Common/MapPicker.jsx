import React, { useState } from 'react';
import { MapPinIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_STYLES, getSavedMapPreference } from '../../config/mapConfig';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition, setPlaceName }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPosition({ lat, lng });
      
      // Reverse geocoding to get place name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        if (data && data.display_name) {
          const shortName = data.address?.road || 
                           data.address?.city || 
                           data.address?.town || 
                           data.address?.village ||
                           data.address?.state ||
                           data.display_name.split(',')[0];
          setPlaceName(shortName);
        } else {
          setPlaceName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch (error) {
        console.error('Error getting place name:', error);
        setPlaceName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    },
  });
  
  return position ? <Marker position={position} /> : null;
}

const MapPicker = ({ onSelect, onClose, title = "Select Location on Map" }) => {
  const [position, setPosition] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState({ 
    lat: 36.8065,
    lng: 10.1815
  });
  
  const savedStyle = getSavedMapPreference();
  const currentStyle = MAP_STYLES[savedStyle] || MAP_STYLES.light;

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const currentPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setPosition(currentPos);
          setMapCenter(currentPos);
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentPos.lat}&lon=${currentPos.lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
              const shortName = data.address?.road || 
                               data.address?.city || 
                               data.address?.town || 
                               data.address?.village ||
                               currentPos.lat.toFixed(4) + ', ' + currentPos.lng.toFixed(4);
              setPlaceName(shortName);
            }
          } catch (error) {
            setPlaceName(`${currentPos.lat.toFixed(4)}, ${currentPos.lng.toFixed(4)}`);
          }
          
          setIsSearching(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location.');
          setIsSearching(false);
        }
      );
    } else {
      alert('Geolocation is not supported.');
    }
  };

  const searchAddressHandler = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const searchedPos = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setPosition(searchedPos);
        setMapCenter(searchedPos);
        setPlaceName(data[0].display_name.split(',')[0]);
      } else {
        alert('Location not found');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (!position) {
      alert('Please select a location by clicking on the map');
      return;
    }
    onSelect(position.lat, position.lng, placeName);
    onClose();
  };

  return (
    <div className="flex flex-col">
      <div className="mb-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchAddressHandler()}
              placeholder="Search city or address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 pl-9 text-sm"
            />
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="button"
            onClick={searchAddressHandler}
            disabled={isSearching}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isSearching ? '...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isSearching}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <MapPinIcon className="h-4 w-4" />
            <span>My Location</span>
          </button>
        </div>
      </div>

      <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ height: '280px' }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          className={`z-0 ${currentStyle.className}`}
        >
          <TileLayer
            attribution={currentStyle.attribution}
            url={currentStyle.url}
            maxZoom={currentStyle.maxZoom}
            subdomains={currentStyle.subdomains}
          />
          <LocationMarker position={position} setPosition={setPosition} setPlaceName={setPlaceName} />
        </MapContainer>
      </div>

      {position ? (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <p className="text-xs font-semibold text-teal-900">Location Selected</p>
              </div>
              
              {placeName && (
                <div className="mb-2">
                  <label className="text-xs text-teal-700 font-medium">PLACE NAME</label>
                  <p className="text-sm font-semibold text-teal-900 mt-0.5">
                    {placeName}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-teal-700 font-medium">LATITUDE</label>
                  <p className="text-sm font-mono font-semibold text-teal-900 mt-0.5">
                    {position.lat.toFixed(6)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-teal-700 font-medium">LONGITUDE</label>
                  <p className="text-sm font-mono font-semibold text-teal-900 mt-0.5">
                    {position.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1 text-sm font-medium transition-colors shadow-sm"
            >
              <CheckIcon className="h-4 w-4" />
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
            <p className="text-xs text-amber-900 font-medium">
              Click anywhere on the map to select a location
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPicker;