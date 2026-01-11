import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { userAPI, departmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const seniorityLevels = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'head', label: 'Head' },
  { value: 'executive', label: 'Executive' },
];

const statusConfig = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-100', icon: ClockIcon },
  confirmed: { label: 'Scheduled', color: 'text-blue-600 bg-blue-100', icon: CalendarIcon },
  completed: { label: 'Completed', color: 'text-green-600 bg-green-100', icon: CheckCircleIcon },
  cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-100', icon: XCircleIcon },
};

const UserDetailModal = ({ userId, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch user details
  const { data: userData, isLoading, isError, error } = useQuery(
    ['user', userId],
    () => userAPI.getUserById(userId),
    {
      enabled: !!userId,
    }
  );

  // Extract user data from response (axios wraps in .data)
  const apiResponse = userData?.data || userData;
  const user = apiResponse?.user;
  const pairingHistory = apiResponse?.pairingHistory || [];
  const stats = apiResponse?.stats || {};

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        departmentId: user.department?.id || '',
        seniorityLevel: user.seniorityLevel || '',
        isActive: user.isActive ?? true,
        isOptedIn: user.isOptedIn ?? true,
      });
      setHasChanges(false);
    }
  }, [user]);

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery(['departments-list'], () =>
    departmentAPI.getDepartments()
  );

  const departments = Array.isArray(departmentsData?.data?.data)
    ? departmentsData.data.data
    : Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : [];

  // Update mutation
  const updateMutation = useMutation(
    (data) => userAPI.updateUser(userId, data),
    {
      onSuccess: () => {
        toast.success('User updated successfully!');
        queryClient.invalidateQueries(['user', userId]);
        queryClient.invalidateQueries(['users']);
        setHasChanges(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      },
    }
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarIconSolid key={star} className="w-4 h-4 text-amber-400" />
          ) : (
            <StarIcon key={star} className="w-4 h-4 text-gray-300" />
          )
        ))}
      </div>
    );
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
            {user && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pairing History ({pairingHistory.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full text-white text-2xl font-bold">
                  {user?.firstName?.charAt(0) || <UserIcon className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {user?.isAdmin && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      Admin ({user?.adminRole?.role})
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              {stats.totalPairings > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalPairings}</div>
                    <div className="text-sm text-gray-500">Total Pairings</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completedPairings}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Avg Rating</div>
                  </div>
                </div>
              )}

              {/* Editable Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.departmentId || ''}
                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seniority Level
                  </label>
                  <select
                    value={formData.seniorityLevel || ''}
                    onChange={(e) => handleInputChange('seniorityLevel', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Not Set</option>
                    {seniorityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Fields */}
              <div className="flex items-center gap-8 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Account</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOptedIn ?? true}
                    onChange={(e) => handleInputChange('isOptedIn', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Opted In to Matching</span>
                </label>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                <p>Created: {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</p>
                <p>Last Updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}</p>
                <p>Last Synced: {user?.lastSyncedAt ? new Date(user.lastSyncedAt).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          ) : (
            /* Pairing History Tab */
            <div className="space-y-4">
              {pairingHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No pairing history yet</p>
                </div>
              ) : (
                pairingHistory.map((pairing) => {
                  const status = statusConfig[pairing.status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={pairing.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full text-primary-600 font-semibold">
                            {pairing.partner?.firstName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {pairing.partner?.firstName} {pairing.partner?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{pairing.partner?.email}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {pairing.round?.name && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {pairing.round.name}
                          </span>
                        )}
                        {pairing.meetingScheduledAt && (
                          <span>
                            Scheduled: {new Date(pairing.meetingScheduledAt).toLocaleDateString()}
                          </span>
                        )}
                        {pairing.meetingCompletedAt && (
                          <span>
                            Completed: {new Date(pairing.meetingCompletedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {pairing.feedback && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">Feedback:</span>
                            {renderStars(pairing.feedback.rating)}
                          </div>
                          {pairing.feedback.comments && (
                            <p className="text-sm text-gray-600 italic">
                              "{pairing.feedback.comments}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {activeTab === 'profile' && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isLoading}
              className="btn btn-primary disabled:opacity-50"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserDetailModal;
