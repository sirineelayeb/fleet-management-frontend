import React from 'react';
import Modal from '../Common/Modal';

const UserFormModal = ({ isOpen, onClose, editingUser, formData, setFormData, onSubmit, isLoading }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? 'Edit User' : 'Add New User'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select name="role" value={formData.role} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="shipment_manager">Shipment Manager</option>
            <option value="admin">Administrator</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.role === 'admin'
              ? 'Admins have full access to all system features'
              : 'Shipment managers can manage shipments and tracking'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password {!editingUser && '*'}
          </label>
          <input type="password" name="password" value={formData.password} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
            required={!editingUser} minLength="6" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password {!editingUser && '*'}
          </label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required={!editingUser} />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isLoading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;