import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import { userAPI, analyticsAPI, departmentAPI } from '../services/api';
import toast from 'react-hot-toast';
import UserDetailModal from '../components/users/UserDetailModal';

const Users = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    status: '',           // 'active' or 'inactive' - user account status
    participation: '',    // 'opted_in', 'opted_in_excluded', 'opted_out', etc.
  });
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [showDateModal, setShowDateModal] = useState(false);
  const [availableFromDate, setAvailableFromDate] = useState('');
  const limit = 20;

  const { data: usersData, isLoading, refetch } = useQuery(
    ['users', 'v2', { search, ...filters, page, limit }],
    () => userAPI.getUsers({ search, ...filters, page, limit })
  );

  const { data: departmentsData } = useQuery(['departments-list'], () =>
    departmentAPI.getDepartments()
  );

  // Extract departments for dropdown
  const departmentsList = Array.isArray(departmentsData?.data?.data)
    ? departmentsData.data.data
    : Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : [];

  const handleSync = async () => {
    try {
      toast.loading('Syncing users from Microsoft...');
      await userAPI.syncUsers();
      toast.dismiss();
      toast.success('Users synced successfully!');
      refetch();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to sync users');
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting users...');
      const response = await analyticsAPI.exportUsers();

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.dismiss();
      toast.success('Export downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export users');
    }
  };

  // Bulk action mutation
  const bulkMutation = useMutation(
    ({ userIds, action, data }) => userAPI.bulkAction(userIds, action, data),
    {
      onSuccess: (response) => {
        const { results } = response.data;
        if (results.failed === 0) {
          toast.success(`${results.success} users updated successfully`);
        } else {
          toast.success(`${results.success} updated, ${results.failed} failed`);
        }
        setSelectedUserIds(new Set());
        queryClient.invalidateQueries('users');
      },
      onError: () => {
        toast.error('Failed to perform bulk action');
      },
    }
  );

  // Selection helpers
  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const toggleSelectUser = (userId) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleBulkAction = (action, data = {}) => {
    const userIds = Array.from(selectedUserIds);
    if (userIds.length === 0) return;

    bulkMutation.mutate({ userIds, action, data });
  };

  const handleSetAvailableFrom = () => {
    if (!availableFromDate) {
      handleBulkAction('set_available_from', { availableFrom: null });
    } else {
      handleBulkAction('set_available_from', { availableFrom: availableFromDate });
    }
    setShowDateModal(false);
    setAvailableFromDate('');
  };

  // Handle both old and new API formats
  const users = Array.isArray(usersData?.data?.data)
    ? usersData.data.data
    : Array.isArray(usersData?.data)
    ? usersData.data
    : Array.isArray(usersData?.data?.users)
    ? usersData.data.users
    : Array.isArray(usersData?.users)
    ? usersData.users
    : [];
  const pagination = usersData?.data?.pagination || usersData?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">
            Manage employee accounts and participation
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn btn-secondary btn-sm">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
          <button onClick={handleSync} className="btn btn-primary btn-sm">
            <ArrowPathIcon className="w-4 h-4" />
            Sync from Microsoft
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Department Filter */}
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="input"
          >
            <option value="">All Departments</option>
            {departmentsList.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Status Filter (Account Active/Inactive) */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Participation Filter */}
          <select
            value={filters.participation}
            onChange={(e) => setFilters({ ...filters, participation: e.target.value })}
            className="input"
          >
            <option value="">All Participation</option>
            <option value="opted_in">Opted In</option>
            <option value="in_grace_period">In Grace Period</option>
            <option value="temporarily_excluded">Temp Opted Out</option>
            <option value="dept_excluded">Dept Excluded</option>
            <option value="opted_out">Opted Out</option>
          </select>
        </div>
      </motion.div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedUserIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card bg-primary-50 border-primary-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-medium text-primary-700">
                  {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedUserIds(new Set())}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBulkAction('opt_in', { skipGracePeriod: true })}
                  disabled={bulkMutation.isLoading}
                  className="btn btn-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  Opt In
                </button>
                <button
                  onClick={() => handleBulkAction('opt_out')}
                  disabled={bulkMutation.isLoading}
                  className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  <UserMinusIcon className="w-4 h-4" />
                  Opt Out
                </button>
                <button
                  onClick={() => handleBulkAction('send_welcome_email')}
                  disabled={bulkMutation.isLoading}
                  className="btn btn-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Send Welcome Email
                </button>
                <button
                  onClick={() => setShowDateModal(true)}
                  disabled={bulkMutation.isLoading}
                  className="btn btn-sm bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Set Available From
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card overflow-hidden p-0"
      >
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUserIds.size === users.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Participation</th>
                <th>Total Pairings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="h-10 bg-gray-200 animate-shimmer rounded"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={selectedUserIds.has(user.id) ? 'bg-primary-50' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="font-medium text-gray-900">
                      {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                    </td>
                    <td className="text-gray-600">{user.email}</td>
                    <td>
                      <span className="badge badge-info">
                        {user.department?.name || user.department || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          user.isActive ? 'badge-success' : 'badge-error'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        // Check if department is N/A (unassigned) or inactive
                        const hasDepartment = user.department?.name || user.department;
                        const deptIsActive = user.department?.isActive !== false;

                        // Determine effective status
                        let status = user.participationStatus;
                        let label = '';
                        let badgeClass = '';

                        // Override status for unassigned or inactive department
                        if (!hasDepartment || hasDepartment === 'N/A') {
                          status = 'dept_excluded';
                        } else if (!deptIsActive && !user.overrideDepartmentExclusion) {
                          // Department exists but is inactive (and no override)
                          status = 'dept_excluded';
                        }

                        // Also check if opted_in_excluded should map to dept_excluded
                        if (status === 'opted_in_excluded') {
                          status = 'dept_excluded';
                        }

                        switch (status) {
                          case 'opted_in':
                            label = 'Opted In';
                            badgeClass = 'badge-success';
                            break;
                          case 'in_grace_period':
                            label = 'Grace Period';
                            badgeClass = 'badge-info';
                            break;
                          case 'temporarily_excluded':
                            label = 'Temp Opted Out';
                            badgeClass = 'badge-warning';
                            break;
                          case 'dept_excluded':
                            label = 'Dept Excluded';
                            badgeClass = 'badge-warning';
                            break;
                          case 'opted_out':
                          default:
                            label = 'Opted Out';
                            badgeClass = 'badge-error';
                            break;
                        }

                        return (
                          <span className={`badge ${badgeClass}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="text-gray-600">{user.totalPairings || 0}</td>
                    <td>
                      <button
                        onClick={() => setSelectedUserId(user.id)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, pagination.totalUsers)} of{' '}
              {pagination.totalUsers} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="btn btn-secondary btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Set Available From Modal */}
      <AnimatePresence>
        {showDateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Set Available From Date
                </h3>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Set a future date when {selectedUserIds.size} selected user{selectedUserIds.size !== 1 ? 's' : ''} will become available for matching again. Leave empty to clear the date.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available from
                </label>
                <input
                  type="date"
                  value={availableFromDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setAvailableFromDate(e.target.value)}
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Users won't be matched until this date
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDateModal(false);
                    setAvailableFromDate('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetAvailableFrom}
                  disabled={bulkMutation.isLoading}
                  className="btn btn-primary"
                >
                  {bulkMutation.isLoading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : availableFromDate ? (
                    'Set Date'
                  ) : (
                    'Clear Date'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
