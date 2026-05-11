// frontend/src/pages/DriverScoreConfig.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../services/driverService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import PaginationComponent from '../components/Common/Pagination';
import StatCard from '../components/Cards/StatCard';
import { usePagination } from '../hooks/usePagination';
import { 
  PencilIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const DriverScoreConfig = () => {
  const queryClient = useQueryClient();
  const { page, limit, handleLimitChange, setPage } = usePagination(1, 10);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustRemark, setAdjustRemark] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsDriver, setLogsDriver] = useState(null);
  const [logsData, setLogsData] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [searchInput, setSearchInput] = useState('');

  // Fetch score config
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['score-config'],
    queryFn: () => driverService.getScoreConfig(),
  });

  // Fetch drivers with pagination
  const { 
    data: driversData, 
    isLoading: driversLoading,
    isFetching,
  } = useQuery({
    queryKey: ['drivers', page, limit, filters],
    queryFn: () => driverService.getAll({ 
      page, 
      limit: limit,
      status: filters.status || undefined,
      search: filters.search || undefined
    }),
    keepPreviousData: true,
    staleTime: 5000,
  });

  // Update score config
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

  // Manual score adjustment
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

  // Fetch score logs
  const fetchLogs = async (driverId) => {
    setLogsLoading(true);
    try {
      const res = await driverService.getScoreLogs(driverId, 500, 1);
      setLogsData(res.data?.logs || res.data || []);
      setLogsDriver(driversData?.data?.find(d => d._id === driverId));
      setShowLogsModal(true);
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  // Search handlers
  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStatusChange = (status) => {
    setFilters({ ...filters, status });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', search: '' });
    setSearchInput('');
    setPage(1);
  };

  const handleConfigChange = (field, value) => {
    const newConfig = { ...configData?.data, [field]: parseFloat(value) };
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

  if (configLoading || (driversLoading && !driversData)) return <LoadingSpinner />;

  const config = configData?.data || {};
  const drivers = driversData?.data || [];
  const pagination = driversData?.pagination || { total: 0, page: 1, pages: 1 };

  // Stats calculations - Only important ones
  const stats = {
    total: pagination.total || 0,
    averageScore: drivers.length > 0 
      ? Math.round(drivers.reduce((sum, d) => sum + (d.score || 100), 0) / drivers.length)
      : 0,
    highScore: drivers.filter(d => (d.score || 100) >= 80).length,
    lowScore: drivers.filter(d => (d.score || 100) < 60).length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Driver Score Management</h1>
        <p className="text-gray-600 mt-1">Monitor and adjust driver performance scores</p>
      </div>

      {/* Stats Cards - Using StatCard component */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Drivers"
          value={stats.total}
          icon={UserGroupIcon}
          color="purple"
          subtitle="Active drivers"
        />
        <StatCard
          title="Average Score"
          value={stats.averageScore}
          icon={ChartBarIcon}
          color="blue"
          subtitle="Overall performance"
        />
        <StatCard
          title="High Performers"
          value={stats.highScore}
          icon={TrophyIcon}
          color="green"
          subtitle="Score ≥ 80"
        />
        <StatCard
          title="Needs Improvement"
          value={stats.lowScore}
          icon={ExclamationTriangleIcon}
          color="red"
          subtitle="Score &lt; 60"
        />
      </div>

      {/* Score Configuration */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Score Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ConfigField
            label="On-Time Points"
            value={config.onTimePoints ?? 5}
            onChange={(val) => handleConfigChange('onTimePoints', val)}
            help="Delivery on planned day"
          />
          <ConfigField
            label="Early Points"
            value={config.earlyPoints ?? 3}
            onChange={(val) => handleConfigChange('earlyPoints', val)}
            help="Delivery before planned day"
          />
          <ConfigField
            label="Late Penalty"
            value={config.latePenalty ?? -10}
            onChange={(val) => handleConfigChange('latePenalty', val)}
            help="Negative points for late delivery"
          />
        </div>
        <p className="text-xs text-gray-400 mt-4">Changes apply to future completed missions only.</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, CIN, license, or phone..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="off_duty">Off Duty</option>
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          {(filters.status || filters.search) && (
            <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Drivers Table */}
       {isFetching ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center" style={{ minHeight: 320 }}>
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400 font-medium">Loading devices...</p>
          </div>
        </div>
      ) : (
        <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Drivers & Scores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{driver.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{driver.cin || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{driver.phone}</td>
                  <td className="px-6 py-4">
                    <ScoreBadge score={driver.score || 100} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{driver.status}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => fetchLogs(driver._id)} className="text-blue-600 hover:text-blue-800" title="View logs">
                      <ClockIcon className="h-5 w-5 inline" />
                    </button>
                    <button onClick={() => {
                      setSelectedDriver(driver);
                      setAdjustPoints(0);
                      setAdjustRemark('');
                      setShowAdjustModal(true);
                    }} className="text-purple-600 hover:text-purple-800" title="Adjust score">
                      <PencilIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No drivers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <PaginationComponent
          currentPage={pagination.page || 1}
          totalPages={pagination.pages || 1}
          onPageChange={setPage}
          onPageSizeChange={handleLimitChange}
          pageSize={limit}
          totalItems={pagination.total || 0}
          showFirstLast={true}
          siblingCount={1}
          showPageSizeSelector={true}
          pageSizeOptions={[5, 10, 25, 50, 100]}
        />
      </div>
       </>
      )}

      {/* Adjust Score Modal */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title={`Adjust Score - ${selectedDriver?.name || ''}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Score</label>
            <p className="text-2xl font-bold text-gray-900">{selectedDriver?.score ?? 100}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Points (can be negative)</label>
            <input
              type="number"
              value={adjustPoints}
              onChange={(e) => setAdjustPoints(parseInt(e.target.value) || 0)}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., +5 or -3"
            />
            <p className="text-xs text-gray-500 mt-1">
              New score: {Math.min(100, Math.max(0, (selectedDriver?.score || 100) + adjustPoints))}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Remark</label>
            <textarea
              value={adjustRemark}
              onChange={(e) => setAdjustRemark(e.target.value)}
              rows="3"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              placeholder="Reason for score adjustment..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAdjustModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleAdjustSubmit} disabled={adjustScoreMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {adjustScoreMutation.isPending ? 'Saving...' : 'Adjust Score'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Score History Modal */}
      <Modal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} title={`Score History - ${logsDriver?.name || ''}`} size="xl">
        <div className="space-y-4">
          {/* Driver Summary */}
          {logsDriver && (
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Driver Information</p>
                <p className="font-medium text-gray-900">{logsDriver.name}</p>
                <p className="text-sm text-gray-500">CIN: {logsDriver.cin || '—'} | Phone: {logsDriver.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Score</p>
                <ScoreBadge score={logsDriver.score || 100} size="lg" />
              </div>
            </div>
          )}

          {/* Logs Table */}
          <div className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logsLoading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading history...</p>
                    </td>
                  </tr>
                ) : logsData.length > 0 ? (
                  logsData.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${log.changeAmount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.newScore}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 capitalize">{log.reason?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-md break-words">{log.remark || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                      <ClockIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No score history available</p>
                      <p className="text-sm mt-1">Score changes will appear here when drivers complete missions or receive manual adjustments.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total Records Counter */}
          {logsData.length > 0 && (
            <div className="pt-3 text-sm text-gray-500 border-t">
              Total records: {logsData.length}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

// Sub-components
const ConfigField = ({ label, value, onChange, help, step = "1" }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      step={step}
      className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />
    <p className="text-xs text-gray-500 mt-1">{help}</p>
  </div>
);

const ScoreBadge = ({ score, size = "md" }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };
  
  const sizeClass = size === "lg" ? "px-3 py-1 text-base" : "px-2 py-1 text-sm";
  
  return (
    <span className={`inline-flex font-bold rounded-full ${sizeClass} ${getColor()}`}>
      {score}
    </span>
  );
};

export default DriverScoreConfig;