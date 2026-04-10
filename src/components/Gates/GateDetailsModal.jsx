// frontend/src/components/Gates/GateDetailsModal.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gateService } from '../../services/gateService';
import { XMarkIcon, ClockIcon, QueueListIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const GateDetailsModal = ({ gate, onClose }) => {
  const [activeTab, setActiveTab] = useState('queue');
  const [logsPage, setLogsPage] = useState(1);

  // Fetch queue status
  const { data: queueData } = useQuery({
    queryKey: ['gate-queue', gate._id],
    queryFn: () => gateService.getQueue(gate._id),
  });
  const queue = queueData?.data;

  // Fetch access logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['gate-logs', gate._id, logsPage],
    queryFn: () => gateService.getAccessLogs(gate._id, { page: logsPage, limit: 10 }),
  });
  const logs = logsData?.data || [];
  const pagination = logsData?.pagination || {};

  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold">{gate.name}</h2>
            <p className="text-sm text-gray-500">{gate.type} • Zone {gate.zone}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
              activeTab === 'queue' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            <QueueListIcon className="h-4 w-4" /> Queue
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${
              activeTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4" /> Access Logs
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'queue' && queue && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Queue:</span>
                  <span className="text-2xl font-bold">{queue.currentQueue}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="text-2xl font-bold">{queue.queueCapacity}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Available Spots:</span>
                  <span className="text-2xl font-bold text-green-600">{queue.availableSpots}</span>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${queue.occupancyPercent}%` }} />
                </div>
                <p className="text-sm text-gray-500 mt-2">Status: {queue.status}</p>
              </div>
              <div className="text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Last updated: {formatDate(gate.updatedAt)}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              {logsLoading ? (
                <div className="text-center py-8">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No access logs found</div>
              ) : (
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log._id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            log.status === 'authorized' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                          <span className="ml-2 text-sm font-medium">{log.accessType}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        <p><strong>Truck:</strong> {log.truck?.licensePlate || log.licensePlate}</p>
                        {log.reason && <p><strong>Reason:</strong> {log.reason}</p>}
                      </div>
                    </div>
                  ))}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setLogsPage(p => Math.max(1, p-1))}
                        disabled={logsPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1">Page {logsPage} of {pagination.pages}</span>
                      <button
                        onClick={() => setLogsPage(p => Math.min(pagination.pages, p+1))}
                        disabled={logsPage === pagination.pages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GateDetailsModal;