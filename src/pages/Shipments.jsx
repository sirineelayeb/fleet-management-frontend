// frontend/src/pages/Shipments.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { shipmentService } from '../services/shipmentService';
import { truckService } from '../services/truckService';
import { driverService } from '../services/driverService';
import ShipmentKanban from '../components/Shipments/ShipmentKanban';
import AssignShipmentModal from '../components/Shipments/AssignShipmentModal';
import ShipmentForm from '../components/Shipments/ShipmentForm';
import Modal from '../components/Common/Modal';                    
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
const PAGE_SIZE = 10;

const Shipments = () => {
  const { user } = useAuth();   
  const navigate = useNavigate(); 
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  // Queries
  const { data: shipmentsResponse, isLoading } = useQuery({
    queryKey: ['shipments', page],
    queryFn: () => shipmentService.getAll({ page, limit: PAGE_SIZE }),
  });
  const { data: trucksResponse } = useQuery({ 
    queryKey: ['trucks'], 
    queryFn: () => truckService.getAll() 
  });
  const { data: driversResponse } = useQuery({
  queryKey: ['drivers'],
  queryFn: () => driverService.getAll(),
});
const drivers = driversResponse?.data || [];
  const shipments = shipmentsResponse?.data || [];
  const pagination = shipmentsResponse?.pagination || { total: 0, page: 1, pages: 1 };
  const trucks = trucksResponse?.data || [];

  // Mutations
  const assignMutation = useMutation({
    mutationFn: ({ shipmentId, truckId, driverId }) => 
      shipmentService.assign(shipmentId, truckId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipments']);
      toast.success('Shipment assigned');
      setShowAssignModal(false);
      setSelectedShipment(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Assign failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (shipmentId) => shipmentService.cancel(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipments']);
      toast.success('Shipment cancelled');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Cancel failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (shipmentId) => shipmentService.delete(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipments']);
      toast.success('Shipment deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Delete failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => shipmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shipments']);
      toast.success('Shipment updated');
      setShowEditModal(false);
      setEditingShipment(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Update failed'),
  });

  // Handlers
  const handleAssignShipment = async (shipmentId, truckId, driverId) => 
    assignMutation.mutateAsync({ shipmentId, truckId, driverId });
    
  const handleCancelShipment = async (shipmentId) => {
    if (window.confirm('Cancel this shipment?')) await cancelMutation.mutateAsync(shipmentId);
  };
  
  const handleDeleteShipment = async (shipmentId) => {
    if (window.confirm('Delete this shipment? This action cannot be undone.')) 
      await deleteMutation.mutateAsync(shipmentId);
  };

  const handleEdit = (shipment) => {
    setEditingShipment(shipment);
    setShowEditModal(true);
  };

  const handleUpdateShipment = async (data) => {
    await updateMutation.mutateAsync({ id: editingShipment._id, data });
  };
 const getCreatePath = () => {
    if (user?.role === 'admin') {
      return '/dashboard/shipments/create';
    }
    return '/shipment_manager/shipments/create';
  };
  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shipment Management</h1>
          <p className="text-gray-600">Manage and track all shipments</p>
        </div>
       <button
        onClick={() => navigate(getCreatePath())}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <PlusIcon className="h-5 w-5" /> New Shipment
      </button>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
          <span className="text-sm text-gray-500">Showing {shipments.length} of {pagination.total}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">Page {pagination.page} of {pagination.pages}</span>
            <button 
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} 
              disabled={page === pagination.pages} 
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <ShipmentKanban
        shipments={shipments}
        onAssign={(shipment) => { setSelectedShipment(shipment); setShowAssignModal(true); }}
        onCancel={handleCancelShipment}
        onDelete={handleDeleteShipment}
        onEdit={handleEdit}                           
      />

      {/* Assign Modal */}
      {showAssignModal && selectedShipment && (
        <AssignShipmentModal
          shipment={selectedShipment}
          trucks={trucks}
          drivers={drivers}
          onClose={() => { setShowAssignModal(false); setSelectedShipment(null); }}
          onAssign={handleAssignShipment}
        />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingShipment(null); }}
        title="Edit Shipment"
        size="lg"
      >
        {editingShipment && (
          <ShipmentForm
            key={editingShipment._id}  
            initialData={editingShipment}
            onSubmit={handleUpdateShipment}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Shipments;