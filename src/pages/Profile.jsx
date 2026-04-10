// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { semantic, primary, getIconColors } from '../constants/colors'; // adjust path if needed

// Helper to get user initials
const getUserInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Avatar component with consistent colors based on role (using semantic colors)
const UserAvatar = ({ name, role, size = 'lg' }) => {
  const initials = getUserInitials(name);
  const roleGradient = {
    admin: `linear-gradient(135deg, ${semantic.danger.primary}, ${semantic.danger.dark})`,
    shipment_manager: `linear-gradient(135deg, ${semantic.success.primary}, ${semantic.success.dark})`,
  };
  const gradient = roleGradient[role] || `linear-gradient(135deg, ${semantic.info.primary}, ${primary.cobalt})`;
  const sizeClass = size === 'lg' ? 'h-24 w-24 text-2xl' : 'h-10 w-10 text-sm';

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shadow-lg`}
      style={{ background: gradient }}
    >
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Real-time validation
  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordValid = newPassword.length >= 6 || newPassword === '';

  useEffect(() => {
    const hasChanges =
      name !== (user?.name || '') ||
      email !== (user?.email || '') ||
      currentPassword !== '' ||
      newPassword !== '' ||
      confirmPassword !== '';
    setDirty(hasChanges);
  }, [name, email, currentPassword, newPassword, confirmPassword, user]);

  const handleReset = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setDirty(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && !passwordsMatch) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword && !isPasswordValid) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword && !currentPassword) {
      toast.error('Current password is required to set a new password');
      return;
    }

    setLoading(true);
    try {
      const updateData = { name, email };
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.password = newPassword;
      }

      const result = await authService.updateMe(updateData);

      if (result.success) {
        setUser((prev) => ({ ...prev, ...result.user }));
        toast.success('Profile updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setDirty(false);
      } else {
        toast.error(result.message || 'Update failed');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    admin: 'Administrator',
    shipment_manager: 'Shipment Manager',
  };
  const roleLabel = roleLabels[user?.role] || user?.role;
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

  // Header gradient using semantic colors
  const headerGradient = `linear-gradient(135deg, ${semantic.info.primary}, ${primary.cobalt})`;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with gradient from color constants */}
        <div className="px-6 py-8 text-white" style={{ background: headerGradient }}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <UserAvatar name={user?.name} role={user?.role} size="lg" />
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold">{user?.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2 justify-center md:justify-start">
                <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm">
                  <ShieldCheckIcon className="h-4 w-4" />
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm">
                  <CalendarIcon className="h-4 w-4" />
                  Joined {joinDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column – Basic info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right column – Password change */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Change Password</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Required to change password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave blank to keep current"
                />
                {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                  <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {newPassword && confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <XCircleIcon className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
                {newPassword && passwordsMatch && newPassword !== '' && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {dirty && (
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              style={{ backgroundColor: semantic.info.primary }}
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;