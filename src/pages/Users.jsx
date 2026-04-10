// src/pages/Users.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { PlusIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import UserStatsCards from '../components/Users/UserStatsCards';
import UserRow from '../components/Users/UserRow';
import UserFormModal from '../components/Users/UserFormModal';

const Users = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'shipment_manager'   // ✅ backend expects 'shipment_manager'
  });

  // Queries
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  });
  const { data: statsData } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => userService.getStats(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['userStats']);
      toast.success('User created successfully');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['userStats']);
      toast.success('User updated successfully');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['userStats']);
      toast.success('User deleted successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user'),
  });

  // Helpers
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'shipment_manager'
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (editingUser) {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };
      if (formData.password) updateData.password = formData.password;
      updateMutation.mutate({ id: editingUser._id, data: updateData });
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    if (window.confirm(`Delete ${user.name}?`)) deleteMutation.mutate(user._id);
  };

  // Data extraction – backend returns { users: [...] } directly
  const users = usersData?.users || [];
  const stats = statsData?.stats || { total: 0, admins: 0, shipmentManagers: 0, active: 0 };
  const adminUsers = users.filter(u => u.role === 'admin');
  const shipmentManagers = users.filter(u => u.role === 'shipment_manager');

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"><p className="text-red-600">Error: {error.message}</p><button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg">Retry</button></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage administrators and shipment managers</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={stats} />

      {/* Admins Table */}
      {adminUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Administrators</h2>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{adminUsers.length}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Full system access</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map(user => <UserRow key={user._id} user={user} onEdit={handleEdit} onDelete={handleDelete} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shipment Managers Table */}
      {shipmentManagers.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shipment Managers</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{shipmentManagers.length}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Shipment management and tracking</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipmentManagers.map(user => <UserRow key={user._id} user={user} onEdit={handleEdit} onDelete={handleDelete} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default Users;