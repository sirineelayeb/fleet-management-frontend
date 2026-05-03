// src/pages/Users.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { PlusIcon, ShieldCheckIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline';
import UserStatsCards from '../components/Users/UserStatsCards';
import UserRow from '../components/Users/UserRow';
import UserFormModal from '../components/Users/UserFormModal';
import Pagination from '../components/Common/Pagination';
import { usePagination } from '../hooks/usePagination';

const Users = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'admins', 'shipment_managers'
  const { page, limit, goToPage, handleLimitChange } = usePagination(1, 10);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'shipment_manager' 
  });

  // Queries with pagination
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => userService.getAll({ page, limit }),
  });
  
  const { data: stats, isLoading: statsLoading } = useQuery({
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

  // Extract data from API response
  const users = usersData?.users || [];
  const pagination = usersData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };
  
  // Stats are returned directly from the API
  const statsData = stats || { total: 0, admins: 0, shipmentManagers: 0, active: 0, inactive: 0 };
  
  // Filter users by role based on active tab
  const getFilteredUsers = () => {
    switch (activeTab) {
      case 'admins':
        return users.filter(u => u.role === 'admin');
      case 'shipment_managers':
        return users.filter(u => u.role === 'shipment_manager');
      default:
        return users;
    }
  };
  
  const filteredUsers = getFilteredUsers();
  const filteredCount = filteredUsers.length;
  
  // Get counts for tabs
  const adminCount = statsData.admins || 0;
  const shipmentManagerCount = statsData.shipmentManagers || 0;
  const totalCount = statsData.total || 0;

  // Tab configuration
  const tabs = [
    { id: 'all', label: 'All Users', icon: UsersIcon, count: totalCount, color: 'blue' },
    { id: 'admins', label: 'Administrators', icon: ShieldCheckIcon, count: adminCount, color: 'red' },
    { id: 'shipment_managers', label: 'Shipment Managers', icon: UserIcon, count: shipmentManagerCount, color: 'green' },
  ];

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-500 text-sm font-medium animate-pulse">
              Loading Users...
            </p>
          </div>
          );
        } 
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Error: {error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage administrators and shipment managers</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={statsData} />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colorClasses = {
              blue: isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              red: isActive ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              green: isActive ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            };
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  goToPage(1); // Reset to first page when changing tabs
                }}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${colorClasses[tab.color]}
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                <span className={`
                  ml-1 px-2 py-0.5 text-xs rounded-full
                  ${isActive ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <UserRow 
                    key={user._id} 
                    user={user} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-500 mb-4">
            {activeTab === 'admins' 
              ? 'No administrators found.' 
              : activeTab === 'shipment_managers'
              ? 'No shipment managers found.'
              : 'No users found.'}
          </p>
          <button
            onClick={() => { setEditingUser(null); resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add New User
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && filteredUsers.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            onPageChange={goToPage}
            onPageSizeChange={handleLimitChange}
            pageSize={limit}
            pageSizeOptions={[5, 10, 25, 50]}
            showFirstLast={true}
            siblingCount={1}
            showPageSizeSelector={true}
            totalItems={pagination.total}
          />
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