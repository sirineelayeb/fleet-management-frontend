import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import { PencilIcon, PlusIcon, XCircleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DriverScoreConfig = () => {
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustRemark, setAdjustRemark] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsDriver, setLogsDriver] = useState(null);
  const [logsData, setLogsData] = useState([]);

  // ── Fetch score config ─────────────────────────────────────────────
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['score-config'],
    queryFn: () => driverService.getScoreConfig(),
  });

  // ── Fetch all drivers ─────────────────────────────────────────────
  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driverService.getAll({ limit: 100 }),
  });

  // ── Update score config mutation ─────────────────────────────────
  const updateConfigMutation = useMutation({
    mutationFn: (data) => driverService.updateScoreConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['score-config']);
      toast.success('Score configuration updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });

  // ── Manual score adjustment mutation ─────────────────────────────
  const adjustScoreMutation = useMutation({
    mutationFn: ({ driverId, points, remark }) => driverService.adjustScore(driverId, points, remark),
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
      toast.success('Driver score adjusted');
      setShowAdjustModal(false);
      setAdjustPoints(0);
      setAdjustRemark('');
      setSelectedDriver(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Adjustment failed');
    },
  });

  // ── Fetch score logs for a driver ────────────────────────────────
  const fetchLogs = async (driverId) => {
    try {
      const res = await driverService.getScoreLogs(driverId, 50);
      setLogsData(res.data);
      setLogsDriver(driversData?.data?.find(d => d._id === driverId));
      setShowLogsModal(true);
    } catch (error) {
      toast.error('Failed to load logs');
    }
  };

  const handleConfigChange = (field, value) => {
    const newConfig = { ...configData.data, [field]: parseFloat(value) };
    updateConfigMutation.mutate(newConfig);
  };

  const handleAdjustSubmit = () => {
    if (!selectedDriver) return;
    adjustScoreMutation.mutate({
      driverId: selectedDriver._id,
      points: adjustPoints,
      remark: adjustRemark || 'Manual adjustment',
    });
  };

  if (configLoading || driversLoading) return <LoadingSpinner />;

  const config = configData?.data || {};
  const drivers = driversData?.data || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Driver Score Management</h1>

      {/* ============================================================ */}
      {/* SCORE CONFIGURATION SECTION */}
      {/* ============================================================ */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Score Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">On‑Time Points</label>
            <input
              type="number"
              value={config.onTimePoints ?? 5}
              onChange={(e) => handleConfigChange('onTimePoints', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Delivery on planned day</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Early Points</label>
            <input
              type="number"
              value={config.earlyPoints ?? 3}
              onChange={(e) => handleConfigChange('earlyPoints', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Delivery before planned day</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Late Penalty</label>
            <input
              type="number"
              value={config.latePenalty ?? -10}
              onChange={(e) => handleConfigChange('latePenalty', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Negative points for late delivery</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Early Threshold (hours)</label>
            <input
              type="number"
              step="0.5"
              value={config.earlyThresholdHours ?? 1}
              onChange={(e) => handleConfigChange('earlyThresholdHours', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Delivery this many hours early = "early"</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4 italic">
          Changes apply to future completed missions only.
        </p>
      </div>

      {/* ============================================================ */}
      {/* DRIVER LIST & SCORE ADJUSTMENT */}
      {/* ============================================================ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Drivers & Scores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {driver.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-sm font-bold rounded-full ${
                      driver.score >= 80 ? 'text-green-700 bg-green-100' :
                      driver.score >= 60 ? 'text-yellow-700 bg-yellow-100' :
                      'text-red-700 bg-red-100'
                    }`}>
                      {driver.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => fetchLogs(driver._id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View score logs"
                    >
                      <ClockIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setAdjustPoints(0);
                        setAdjustRemark('');
                        setShowAdjustModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-800"
                      title="Adjust score manually"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MANUAL ADJUST MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={`Adjust Score – ${selectedDriver?.name || ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Points (can be negative)</label>
            <input
              type="number"
              value={adjustPoints}
              onChange={(e) => setAdjustPoints(parseInt(e.target.value) || 0)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., +5 or -3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Remark (reason)</label>
            <textarea
              value={adjustRemark}
              onChange={(e) => setAdjustRemark(e.target.value)}
              rows="2"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Customer complaint, good performance bonus"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustSubmit}
              disabled={adjustScoreMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {adjustScoreMutation.isPending ? 'Saving...' : 'Adjust Score'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* SCORE LOGS MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        title={`Score History – ${logsDriver?.name || ''}`}
        size="lg"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Change</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">New Score</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remark / Mission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logsData.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold">
                    <span className={log.changeAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                      {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{log.newScore}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{log.reason}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {log.remark || (log.mission ? `Mission: ${log.mission._id}` : '—')}
                  </td>
                </tr>
              ))}
              {logsData.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center text-gray-400">
                    No score changes recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default DriverScoreConfig;