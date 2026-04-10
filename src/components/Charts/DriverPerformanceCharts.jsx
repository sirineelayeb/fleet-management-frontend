// frontend/src/components/Charts/DriverPerformanceCharts.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { performanceService } from '../../services/performanceService';
import { driverService } from '../../services/driverService';
import { UserIcon, TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';

// Helper to resolve photo URL (copy from Drivers.jsx or import)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolvePhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.replace(/\\/g, '/');
  const uploadsIndex = clean.indexOf('uploads/');
  if (uploadsIndex !== -1) return `${BASE_URL}/${clean.slice(uploadsIndex)}`;
  return `${BASE_URL}/${clean.replace(/^\//, '')}`;
};

// Avatar component (same as in Drivers page)
const DriverAvatar = ({ driver, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const photoUrl = resolvePhotoUrl(driver.photo?.url);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={driver.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white`}
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = driver.name?.charAt(0)?.toUpperCase() || '?';
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
  const color = colors[(driver.name?.charCodeAt(0) ?? 0) % colors.length];

  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center ring-2 ring-white`}>
      <span className="text-white font-semibold text-xs">{initials}</span>
    </div>
  );
};

const DriverPerformanceCharts = () => {
  const [period, setPeriod] = useState('month');
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [view, setView] = useState('leaderboard');

  // Fetch all drivers (includes photo)
  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driverService.getAll({ limit: 1000 }),
  });

  // Fetch leaderboard (score sorted)
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => performanceService.getLeaderboard(10, period),
  });

  // Fetch detailed performance for selected driver
  const { data: driverPerformance, isLoading: driverLoading } = useQuery({
    queryKey: ['driverPerformance', selectedDriverId, period],
    queryFn: () => performanceService.getDriverPerformance(selectedDriverId, period),
    enabled: !!selectedDriverId,
  });

  // Fetch score logs for selected driver
  const { data: scoreLogsData } = useQuery({
    queryKey: ['driverScoreLogs', selectedDriverId],
    queryFn: () => driverService.getScoreLogs(selectedDriverId, 10),
    enabled: !!selectedDriverId,
  });

  const drivers = driversData?.data || [];
  const leaderboardRaw = leaderboardData?.data || [];
  const driverMetrics = driverPerformance?.data?.metrics;
  const driverInfo = driverPerformance?.data?.driver;
  const scoreLogs = scoreLogsData?.data || [];

  // ✅ ENRICH leaderboard with full driver data (including photo)
  const leaderboard = leaderboardRaw.map(leader => {
    const fullDriver = drivers.find(d => d._id === leader.id);
    return {
      ...leader,
      name: fullDriver?.name || leader.name,
      photo: fullDriver?.photo,
      score: leader.score,
      stats: leader.stats,
    };
  });

  // ✅ For the selected driver details, also get photo from full list
  const selectedFullDriver = drivers.find(d => d._id === selectedDriverId);
  const driverWithPhoto = selectedFullDriver ? { ...driverInfo, photo: selectedFullDriver.photo } : driverInfo;

  if (leaderboardLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => setView('leaderboard')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              view === 'leaderboard' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrophyIcon className="h-4 w-4" />
            Leaderboard
          </button>
          <button
            onClick={() => setView('details')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              view === 'details' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Driver Details
          </button>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Leaderboard View */}
      {view === 'leaderboard' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Driver Leaderboard</h2>
            <p className="text-sm text-gray-500">Ranked by performance score</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On-Time %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((driver, index) => (
                  <tr 
                    key={driver.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedDriverId(driver.id);
                      setView('details');
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                       <DriverAvatar driver={driver} size="md" />
                        <span className="font-medium text-gray-900">{driver.name}</span>   </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-lg">{driver.score}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{driver.stats?.totalTrips || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 rounded-full h-2" 
                            style={{ width: `${driver.stats?.onTimeRate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm">{driver.stats?.onTimeRate || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No driver performance data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Details View */}
      {view === 'details' && !selectedDriverId && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Select a Driver</h3>
          <p className="text-gray-500 mt-2">Click on a driver from the leaderboard to view details</p>
          <button
            onClick={() => setView('leaderboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Leaderboard
          </button>
        </div>
      )}

      {view === 'details' && selectedDriverId && driverLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}

      {view === 'details' && selectedDriverId && driverMetrics && (
        <div className="space-y-6">
          {/* Driver Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <DriverAvatar driver={driverWithPhoto || { name: driverInfo?.name, photo: driverInfo?.photo }} size="lg" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{driverInfo?.name}</h2>
                <p className="text-gray-500">{driverInfo?.phone}</p>
              </div>
              <div className="ml-auto text-center">
                <p className="text-3xl font-bold text-blue-600">{driverMetrics.score}</p>
                <p className="text-sm text-gray-500">Performance Score</p>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{driverMetrics.totalTrips}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">On-Time Delivery</p>
              <p className="text-2xl font-bold text-green-600">{driverMetrics.onTimeDeliveryRate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Total Distance</p>
              <p className="text-2xl font-bold text-blue-600">{driverMetrics.totalDistance} km</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Avg Speed</p>
              <p className="text-2xl font-bold text-purple-600">{driverMetrics.averageSpeed} km/h</p>
            </div>
          </div>

          {/* Score Change Logs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Recent Score Changes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scoreLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={log.changeAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.newScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.reason === 'on_time_delivery' ? 'On-Time Delivery' :
                         log.reason === 'early_delivery' ? 'Early Delivery' :
                         log.reason === 'late_delivery' ? 'Late Delivery' :
                         log.reason === 'manual_adjustment' ? 'Manual Adjustment' : log.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.remark || '-'}
                      </td>
                    </tr>
                  ))}
                  {scoreLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No score changes recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedDriverId(null);
                setView('leaderboard');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Back to Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPerformanceCharts;