import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, ArchiveBoxIcon, ArrowPathIcon, FunnelIcon, MagnifyingGlassIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';
import CustomerFormModal from '../components/Customers/CustomerFormModal';
import CustomerDetailsModal from '../components/Customers/CustomerDetailsModal';
import Pagination from '../components/Common/Pagination';
import toast from 'react-hot-toast';

const Customers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: customersData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['customers', page, limit, showActiveOnly, searchTerm],
    queryFn: () => customerService.getAll({ 
      page, 
      limit, 
      isActive: showActiveOnly ? 'true' : 'false', 
      search: searchTerm 
    }),
    keepPreviousData: true,
  });

  const customers = customersData?.data || [];
  const pagination = customersData?.pagination || { 
    total: 0, 
    page: 1, 
    limit: 10, 
    totalPages: 0,
    hasPrevPage: false,
    hasNextPage: false
  };

  const deleteMutation = useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer deleted successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Delete failed'),
  });

  const archiveMutation = useMutation({
    mutationFn: customerService.archive,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer archived successfully');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: customerService.restore,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer restored successfully');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete customer "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleArchive = (id) => {
    if (window.confirm('Archive this customer?')) {
      archiveMutation.mutate(id);
    }
  };

  const handleRestore = (id) => {
    restoreMutation.mutate(id);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setShowActiveOnly(true);
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
    setLimit(10);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setLimit(newSize);
    setPage(1);
  };

  const hasActiveFilters = !showActiveOnly || searchTerm;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
              <UsersIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-500 text-sm font-medium animate-pulse">
              Loading Customers...
            </p>
          </div>
          );
        } 

  if (error) {
    console.error('Error loading customers:', error);
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error loading customers: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customers and track their shipments</p>
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          {/* Status Filter */}
          <select
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={showActiveOnly ? 'active' : 'archived'}
            onChange={(e) => {
              setShowActiveOnly(e.target.value === 'active');
              setPage(1);
            }}
          >
            <option value="active">Active Customers</option>
            <option value="archived">Archived Customers</option>
          </select>
          
          {/* Search Button */}
          <button 
            onClick={handleSearch} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Search
          </button>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button 
              onClick={clearFilters} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Loading indicator */}
        {isFetching && (
          <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading customers...
          </div>
        )}
      </div>

      {/* Info Banner */}
      {hasActiveFilters && (
        <div className="mb-4 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
          {!showActiveOnly && 'Showing archived customers'}
          {searchTerm && ` • Search: "${searchTerm}"`}
          {customers.length === 0 && ' • No customers found'}
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No {showActiveOnly ? 'active' : 'archived'} customers found
                    {searchTerm && ` matching "${searchTerm}"`}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone || '—'}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email || '—'}
                     </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">{customer.address || '—'}</div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {customer.isActive ? 'Active' : 'Archived'}
                      </span>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => { setEditingCustomer(customer); setShowForm(true); }}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {customer.isActive ? (
                        <button
                          onClick={() => handleArchive(customer._id)}
                          className="text-amber-600 hover:text-amber-800 transition-colors"
                          title="Archive"
                        >
                          <ArchiveBoxIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(customer._id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Restore"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(customer._id, customer.name)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Component */}
      {pagination.totalPages > 0 && (
        <Pagination
          currentPage={pagination.page || page}
          totalPages={pagination.totalPages || 1}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={limit}
          pageSizeOptions={[5, 10, 25, 50, 100]}
          showFirstLast={true}
          siblingCount={1}
          showPageSizeSelector={true}
          totalItems={pagination.total || 0}
        />
      )}

      {/* Modals */}
      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries(['customers']);
          }}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default Customers;