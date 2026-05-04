import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { truckService } from '../../services/truckService';
import { TruckIcon, QrCodeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Html5Qrcode } from 'html5-qrcode';

const DeviceForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({ deviceId: '', truckId: '' });
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const scannerRef = useRef(null);

  const { data: allTrucksData } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => truckService.getAll({ limit: 1000 }),
    retry: 1
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        deviceId: initialData.deviceId || '',
        truckId: initialData.truck?._id || initialData.truckId || ''
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
            setScanSuccess(`✅ Device ID scanned: ${decodedText.trim()}`);
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
    return () => { stopScan(); };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const trucks = allTrucksData?.data || [];

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
            placeholder="Scan QR or enter manually (e.g., A4CF1234ABCD)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="button"
            onClick={scanning ? stopScan : startScan}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanning
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            {scanning ? (
              <><XMarkIcon className="h-4 w-4" /> Stop</>
            ) : (
              <><QrCodeIcon className="h-4 w-4" /> Scan QR</>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Scan the QR sticker on the device, or type the ID printed on it
        </p>
      </div>

      {/* Scanner */}
      {scanning && (
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
          <div id="qr-reader" className="w-full" />
          <p className="text-center text-white text-xs py-2">
            Point camera at the QR sticker on the device
          </p>
        </div>
      )}

      {scanSuccess && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          {scanSuccess}
        </p>
      )}

      {scanError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {scanError}
        </p>
      )}

      {/* Truck assignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <TruckIcon className="h-4 w-4 text-gray-500" />
          Assign to Truck (Optional)
        </label>
        <select
          name="truckId"
          value={formData.truckId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Unassigned —</option>
          {trucks.map((truck) => (
            <option key={truck._id} value={truck._id}>
              {truck.licensePlate} {truck.model ? `· ${truck.model}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {initialData ? 'Update' : 'Register'} Device
        </button>
      </div>
    </form>
  );
};

export default DeviceForm;