import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { departmentAPI } from '../services/api';
import toast from 'react-hot-toast';

const DepartmentCard = ({ department, onToggle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {department.name}
              </h3>
              <p className="text-sm text-gray-500">{department.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {department.totalUsers || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {department.activeUsers || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Participation</p>
              <p className="text-2xl font-bold text-gray-900">
                {department.participationRate || 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span
                className={`badge ${
                  department.isEnabled ? 'badge-success' : 'badge-error'
                }`}
              >
                {department.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
              {department.enrollmentDate && (
                <span className="text-sm text-gray-500">
                  Enrolled: {new Date(department.enrollmentDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <button
              onClick={() => onToggle(department)}
              className={`btn btn-sm ${
                department.isEnabled ? 'btn-secondary' : 'btn-primary'
              }`}
            >
              {department.isEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Departments = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [confirmDepartment, setConfirmDepartment] = useState(null);

  const { data: departmentsData, isLoading } = useQuery(['departments', 'v2'], () =>
    departmentAPI.getDepartments()
  );

  const toggleMutation = useMutation(
    ({ id, isEnabled }) =>
      isEnabled
        ? departmentAPI.disableDepartment(id)
        : departmentAPI.enableDepartment(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
        // Also invalidate users query so Users page refreshes with new participation statuses
        queryClient.invalidateQueries('users');
        toast.success('Department updated successfully!');
      },
      onError: () => {
        toast.error('Failed to update department');
      },
    }
  );

  const createMutation = useMutation(
    (name) => departmentAPI.createDepartment({ name, isActive: false }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
        toast.success('Department created successfully!');
        setShowCreateModal(false);
        setNewDeptName('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create department');
      },
    }
  );

  const handleToggle = (department) => {
    if (department.isEnabled) {
      // Disable immediately - no confirmation needed
      toggleMutation.mutate({
        id: department.id,
        isEnabled: true,
      });
    } else {
      // Show confirmation modal for enabling
      setConfirmDepartment(department);
    }
  };

  const handleConfirmEnable = () => {
    if (confirmDepartment) {
      toggleMutation.mutate({
        id: confirmDepartment.id,
        isEnabled: false,
      });
      setConfirmDepartment(null);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (newDeptName.trim()) {
      createMutation.mutate(newDeptName.trim());
    }
  };

  // Handle axios response wrapper: response.data.data
  const departments = Array.isArray(departmentsData?.data?.data)
    ? departmentsData.data.data
    : Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : Array.isArray(departmentsData?.departments)
    ? departmentsData.departments
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="mt-2 text-gray-600">
            Manage department enrollment and participation
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          Add Department
        </button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">
                {departments.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Departments</p>
              <p className="text-2xl font-bold text-gray-900">
                {departments.filter((d) => d.isEnabled).length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {departments.reduce((sum, d) => sum + (d.totalUsers || 0), 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Departments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-48 bg-gray-200 animate-shimmer rounded"></div>
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No departments yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first department
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Add Department
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map((department, index) => (
            <motion.div
              key={department.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <DepartmentCard department={department} onToggle={handleToggle} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Add New Department
            </h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g., Engineering, Sales, HR"
                  className="input w-full"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  The department will be created as disabled. You can enable it later.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewDeptName('');
                  }}
                  className="btn btn-secondary"
                  disabled={createMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isLoading || !newDeptName.trim()}
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Enable Department Confirmation Modal */}
      {confirmDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Enable {confirmDepartment.name}?
                </h2>
                <p className="text-sm text-gray-500">
                  This will activate Coffee Roulette for this department
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-900 mb-3">
                The following will happen when you enable this department:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full mt-0.5">
                    <UserGroupIcon className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {confirmDepartment.totalUsers || 0} users
                    </span>
                    <span className="text-sm text-gray-600">
                      {' '}will be automatically opted into Coffee Roulette
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-100 rounded-full mt-0.5">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Welcome emails</span>
                    <span className="text-sm text-gray-600">
                      {' '}will be sent to all users explaining the program
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 rounded-full mt-0.5">
                    <ClockIcon className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">48-hour grace period</span>
                    <span className="text-sm text-gray-600">
                      {' '}before users are included in matching
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-amber-100 rounded-full mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Users can opt out at any time via the email link
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDepartment(null)}
                className="btn btn-secondary"
                disabled={toggleMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnable}
                className="btn btn-primary"
                disabled={toggleMutation.isLoading}
              >
                {toggleMutation.isLoading ? 'Enabling...' : 'Enable Department'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Departments;
