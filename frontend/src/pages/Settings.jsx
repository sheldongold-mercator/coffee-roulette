import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  ClockIcon,
  BellIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const SettingCard = ({ category, settings, onUpdate }) => {
  const [values, setValues] = useState({});

  const handleSave = () => {
    const updates = Object.entries(values).map(([key, value]) => ({
      key,
      value,
    }));

    updates.forEach(({ key, value }) => {
      onUpdate({ key, value });
    });

    setValues({});
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {category}
        </h3>
      </div>
      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {setting.name}
            </label>
            <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
            {setting.type === 'boolean' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    values[setting.key] !== undefined
                      ? values[setting.key]
                      : setting.value
                  }
                  onChange={(e) =>
                    setValues({ ...values, [setting.key]: e.target.checked })
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  {values[setting.key] !== undefined
                    ? values[setting.key]
                      ? 'Enabled'
                      : 'Disabled'
                    : setting.value
                    ? 'Enabled'
                    : 'Disabled'}
                </span>
              </label>
            ) : setting.type === 'number' ? (
              <input
                type="number"
                value={
                  values[setting.key] !== undefined
                    ? values[setting.key]
                    : setting.value
                }
                onChange={(e) =>
                  setValues({ ...values, [setting.key]: parseInt(e.target.value) })
                }
                className="input"
              />
            ) : (
              <input
                type="text"
                value={
                  values[setting.key] !== undefined
                    ? values[setting.key]
                    : setting.value
                }
                onChange={(e) =>
                  setValues({ ...values, [setting.key]: e.target.value })
                }
                className="input"
              />
            )}
          </div>
        ))}
      </div>
      {Object.keys(values).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button onClick={handleSave} className="btn btn-primary">
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('matching');

  const { data: settingsData, isLoading } = useQuery(['settings', 'v2'], () =>
    settingsAPI.getAllSettings()
  );

  const { data: jobStatus } = useQuery(['job-status', 'v2'], () =>
    settingsAPI.getJobStatus()
  );

  const updateMutation = useMutation(
    ({ key, value }) => settingsAPI.updateSetting(key, value),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success('Settings updated successfully!');
      },
      onError: () => {
        toast.error('Failed to update settings');
      },
    }
  );

  const triggerJobMutation = useMutation(
    (jobKey) => settingsAPI.triggerJob(jobKey),
    {
      onSuccess: () => {
        toast.success('Job triggered successfully!');
      },
      onError: () => {
        toast.error('Failed to trigger job');
      },
    }
  );

  const handleUpdate = (data) => {
    updateMutation.mutate(data);
  };

  const handleTriggerJob = (jobKey) => {
    if (window.confirm('Are you sure you want to trigger this job?')) {
      triggerJobMutation.mutate(jobKey);
    }
  };

  // Handle axios response wrapper: response.data.data
  const settingsObj = settingsData?.data?.data || settingsData?.data || settingsData?.settings || {};
  const settings = Object.entries(settingsObj).map(([key, value]) => ({
    key,
    category: key.split('.')[0], // Extract category from key (e.g., "matching.weight" -> "matching")
    ...value
  }));

  const jobs = Array.isArray(jobStatus?.data?.data)
    ? jobStatus.data.data
    : Array.isArray(jobStatus?.data)
    ? jobStatus.data
    : Array.isArray(jobStatus?.jobs)
    ? jobStatus.jobs
    : [];

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  const categories = Object.keys(groupedSettings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system settings and scheduled jobs
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === category
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'jobs'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheduled Jobs
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : activeTab === 'jobs' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {jobs.map((job) => (
            <div key={job.key} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {job.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Schedule: {job.schedule}
                      </span>
                    </div>
                    {job.lastRun && (
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          Last run:{' '}
                          {new Date(job.lastRun).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleTriggerJob(job.key)}
                  disabled={triggerJobMutation.isLoading}
                  className="btn btn-secondary"
                >
                  Trigger Now
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SettingCard
            category={activeTab}
            settings={groupedSettings[activeTab] || []}
            onUpdate={handleUpdate}
          />
        </motion.div>
      )}
    </div>
  );
};

export default Settings;
