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
  PencilIcon,
} from '@heroicons/react/24/outline';

// Helper to get user initials
const getUserInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Avatar component with role-based colors (matching Trucks page status colors)
const UserAvatar = ({ name, role, size = 'lg' }) => {
  const initials = getUserInitials(name);
  const roleColors = {
    admin: 'from-red-500 to-red-700',
    shipment_manager: 'from-teal-500 to-teal-700', // Using teal like Trucks page
  };
  const gradientClass = roleColors[role] || 'from-teal-600 to-teal-700';
  const sizeClass = size === 'lg' ? 'h-24 w-24 text-2xl' : 'h-10 w-10 text-sm';

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-r ${gradientClass} flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    setIsEditing(false);
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
        setIsEditing(false);
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
  const joinDate =
    user?.createdAt && !isNaN(new Date(user.createdAt))
      ? new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A';

  return (
    <div className="p-6">
      {/* Header - matching Trucks page style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700"
          >
            <PencilIcon className="h-5 w-5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Profile Card - matching table card style from Trucks page */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <UserAvatar name={user?.name} role={user?.role} size="lg" />
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold">{user?.name}</h2>
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

        {/* Form - matching table styling */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                {/* Full Name Row */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 w-1/3">
                    <div className="flex items-center gap-2">
                      <UserCircleIcon className="h-5 w-5 text-gray-400" />
                      Full Name
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {isEditing ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    ) : (
                      <span className="text-gray-900">{name}</span>
                    )}
                  </td>
                </tr>

                {/* Email Row */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      Email Address
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {isEditing ? (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    ) : (
                      <span className="text-gray-900">{email}</span>
                    )}
                  </td>
                </tr>

                {/* Password Section - only shown when editing */}
                {isEditing && (
                  <>
                    {/* Current Password Row */}
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <KeyIcon className="h-5 w-5 text-gray-400" />
                          Current Password
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          placeholder="Required to change password"
                        />
                      </td>
                    </tr>

                    {/* New Password Row */}
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <KeyIcon className="h-5 w-5 text-gray-400" />
                          New Password
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          placeholder="Leave blank to keep current"
                        />
                        {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                          <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                        )}
                      </td>
                    </tr>

                    {/* Confirm Password Row */}
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <KeyIcon className="h-5 w-5 text-gray-400" />
                          Confirm Password
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
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
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Action Buttons - matching Trucks page button styles */}
          {isEditing && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (dirty === false && !newPassword)}
                className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
                <CheckCircleIcon className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;