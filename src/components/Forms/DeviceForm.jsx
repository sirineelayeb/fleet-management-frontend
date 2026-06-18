import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { truckService } from '../../services/truckService';
import { TruckIcon, QrCodeIcon, XMarkIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Html5Qrcode } from 'html5-qrcode';

const LiveStatusBadge = ({ status }) => {
  const config = {
    active:      { label: 'Online',  dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
    inactive:    { label: 'Offline', dot: 'bg-gray-500',  badge: 'bg-gray-100 text-gray-700' },
    maintenance: { label: 'Maintenance', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' }
  };
  const current = config[status] || config.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${current.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};

const DeviceForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    deviceId: '',
    truckId: '',
    maintenanceMode: false
  });

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const scannerRef = useRef(null);

  const { data: allTrucksData } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000 }),
    retry: 1
  });

  // Load edit data
  useEffect(() => {
    if (initialData) {
      setFormData({
        deviceId: initialData.deviceId || '',
        truckId: initialData.truck?._id || initialData.truckId || '',
        maintenanceMode: initialData.status === 'maintenance'
      });
    }
  }, [initialData]);

  const startScan = async () => {
    setScanError('');
    setScanSuccess('');
    setScanning(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            setFormData(prev => ({ ...prev, deviceId: decodedText.trim() }));
            setScanSuccess(`Device ID scanned: ${decodedText.trim()}`);
            stopScan();
          },
          () => {}
        );
      } catch (err) {
        setScanError('Camera access denied. Please allow camera or enter ID manually.');
        setScanning(false);
      }
    }, 100);
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // active/inactive is derived automatically from GPS data on the backend.
    // The only thing an admin can set manually is maintenance mode.
    onSubmit({
      deviceId: formData.deviceId,
      truckId: formData.truckId,
      status: formData.maintenanceMode ? 'maintenance' : 'auto'
    });
  };

  const trucks = allTrucksData?.data || [];
  const isMaintenance = formData.maintenanceMode;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Device ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Device ID *
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            name="deviceId"
            value={formData.deviceId}
            onChange={handleChange}
            placeholder="Scan QR or enter manually"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />

          <button
            type="button"
            onClick={scanning ? stopScan : startScan}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanning
                ? 'bg-red-100 text-red-700'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}
          >
            {scanning ? (
              <><XMarkIcon className="h-4 w-4" /> Stop</>
            ) : (
              <><QrCodeIcon className="h-4 w-4" /> Scan</>
            )}
          </button>
        </div>
      </div>

      {/* Scanner */}
      {scanning && <div id="qr-reader" className="w-full bg-black rounded-lg" />}

      {scanSuccess && (
        <p className="text-sm text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">
          {scanSuccess}
        </p>
      )}

      {scanError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {scanError}
        </p>
      )}

      {/* Truck */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <TruckIcon className="h-4 w-4" />
          Assign Truck
        </label>

        <select
          name="truckId"
          value={formData.truckId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">— Unassigned —</option>
          {trucks.map((truck) => (
            <option key={truck._id} value={truck._id}>
              {truck.licensePlate}
            </option>
          ))}
        </select>
      </div>

      {/* Live status — read only, only meaningful once the device exists */}
      {initialData && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-700">Live Status</p>
            <p className="text-xs text-gray-500">
              {initialData.status === 'maintenance'
                ? 'Manually set by admin'
                : 'Auto-detected from GPS data'}
            </p>
          </div>
          <LiveStatusBadge status={initialData.status} />
        </div>
      )}

      {/* Maintenance toggle — the only manual control */}
      <div>
        <label className="flex items-center justify-between gap-3 px-3 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
              <p className="text-xs text-gray-500">
                Pulls this device out of automatic online/offline tracking
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isMaintenance}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, maintenanceMode: e.target.checked }))
            }
            className="h-5 w-5 rounded text-teal-600 focus:ring-teal-500"
          />
        </label>

        {isMaintenance && (
          <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
            🟠 Will be marked as Maintenance
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg"
        >
          {initialData ? 'Update' : 'Register'} Device
        </button>
      </div>
    </form>
  );
};

export default DeviceForm;