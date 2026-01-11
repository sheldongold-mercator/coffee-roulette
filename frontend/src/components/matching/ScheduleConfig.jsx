import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { matchingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ScheduleConfig = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState('monthly');
  const [nextRunDate, setNextRunDate] = useState('');
  const [nextRunTime, setNextRunTime] = useState('09:00');

  const { data: scheduleData, isLoading } = useQuery(
    ['matching-schedule'],
    () => matchingAPI.getSchedule()
  );

  // Memoize config extraction to avoid repetition
  const config = useMemo(
    () => scheduleData?.data?.data || scheduleData?.data || {},
    [scheduleData]
  );

  // Update local state when config changes
  React.useEffect(() => {
    if (config.scheduleType) {
      setSelectedType(config.scheduleType);
    }
    if (config.nextRunDate) {
      const date = new Date(config.nextRunDate);
      setNextRunDate(format(date, 'yyyy-MM-dd'));
      setNextRunTime(format(date, 'HH:mm'));
    }
  }, [config]);

  const updateScheduleMutation = useMutation(
    (data) => matchingAPI.updateSchedule(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('matching-schedule');
        queryClient.invalidateQueries('job-status');
        const data = response?.data;
        if (data?.jobActive === false) {
          toast.success('Schedule saved! Will take effect after server restart.', { duration: 5000 });
        } else {
          toast.success('Schedule updated successfully!');
        }
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update schedule');
      },
    }
  );

  const toggleAutoScheduleMutation = useMutation(
    (enabled) => matchingAPI.toggleAutoSchedule(enabled),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('matching-schedule');
        toast.success('Auto-scheduling toggled successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to toggle auto-scheduling');
      },
    }
  );

  const handleSave = () => {
    if (!nextRunDate) {
      toast.error('Please select the next scheduled run date');
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${nextRunDate}T${nextRunTime}`);

    if (scheduledDateTime <= new Date()) {
      toast.error('Next scheduled run must be in the future');
      return;
    }

    updateScheduleMutation.mutate({
      scheduleType: selectedType,
      nextRunDate: scheduledDateTime.toISOString(),
    });
  };

  const handleCancel = () => {
    setSelectedType(config.scheduleType || 'monthly');
    if (config.nextRunDate) {
      const date = new Date(config.nextRunDate);
      setNextRunDate(format(date, 'yyyy-MM-dd'));
      setNextRunTime(format(date, 'HH:mm'));
    }
    setIsEditing(false);
  };

  const scheduleTypeOptions = [
    { value: 'weekly', label: 'Weekly', description: 'Repeats every week on the same day' },
    { value: 'biweekly', label: 'Bi-weekly', description: 'Repeats every two weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Repeats every month on the same day' },
  ];

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-sky-50 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Schedule Configuration</h3>
            <p className="text-sm text-gray-500">Configure automatic matching schedule</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-secondary btn-sm"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {scheduleTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedType === option.value
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Next Scheduled Run - Date & Time Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Scheduled Run
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="date"
                  value={nextRunDate}
                  onChange={(e) => setNextRunDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="input w-full"
                />
              </div>
              <div className="w-32">
                <input
                  type="time"
                  value={nextRunTime}
                  onChange={(e) => setNextRunTime(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Subsequent runs will repeat {selectedType === 'weekly' ? 'every week' : selectedType === 'biweekly' ? 'every two weeks' : 'every month'} from this date
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={updateScheduleMutation.isLoading}
              className="btn btn-primary"
            >
              {updateScheduleMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <ClockIcon className="w-4 h-4" />
                Schedule Type
              </div>
              <div className="font-semibold text-gray-900 capitalize">
                {config.scheduleType === 'biweekly' ? 'Bi-weekly' : config.scheduleType || 'Monthly'}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <CalendarIcon className="w-4 h-4" />
                Next Scheduled Run
              </div>
              <div className="font-semibold text-gray-900">
                {config.nextRunDate
                  ? format(new Date(config.nextRunDate), 'MMM d, yyyy h:mm a')
                  : 'Not scheduled'}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <CheckCircleIcon className="w-4 h-4" />
                Status
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    config.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="font-semibold text-gray-900">
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled || false}
                onChange={(e) => toggleAutoScheduleMutation.mutate(e.target.checked)}
                disabled={toggleAutoScheduleMutation.isLoading}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">Enable automatic matching</span>
            </label>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ScheduleConfig;
