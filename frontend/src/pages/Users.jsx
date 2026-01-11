import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { userAPI, analyticsAPI, departmentAPI } from '../services/api';
import toast from 'react-hot-toast';
import UserDetailModal from '../components/users/UserDetailModal';

const Users = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    status: '',           // 'active' or 'inactive' - user account status
    participation: '',    // 'eligible', 'opted_in_excluded', 'opted_out'
  });
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
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
            <option value="eligible">Eligible</option>
            <option value="in_grace_period">In Grace Period</option>
            <option value="opted_in_excluded">Opted In (Dept Excluded)</option>
            <option value="opted_out">Opted Out</option>
          </select>
        </div>
      </motion.div>

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
                    <td colSpan={7}>
                      <div className="h-10 bg-gray-200 animate-shimmer rounded"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
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
                      <span
                        className={`badge ${
                          user.participationStatus === 'eligible'
                            ? 'badge-success'
                            : user.participationStatus === 'in_grace_period'
                            ? 'badge-info'
                            : user.participationStatus === 'opted_in_excluded'
                            ? 'badge-warning'
                            : 'badge-error'
                        }`}
                      >
                        {user.participationStatus === 'eligible'
                          ? 'Eligible'
                          : user.participationStatus === 'in_grace_period'
                          ? 'Grace Period'
                          : user.participationStatus === 'opted_in_excluded'
                          ? 'Dept Excluded'
                          : 'Opted Out'}
                      </span>
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
    </div>
  );
};

export default Users;
