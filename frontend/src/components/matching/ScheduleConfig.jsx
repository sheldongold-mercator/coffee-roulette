import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { matchingAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ScheduleConfig = () => {
  const queryClient = useQueryClient();
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const dropdownRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const { data: scheduleData, isLoading } = useQuery(
    ['matching-schedule'],
    () => matchingAPI.getSchedule()
  );

  const config = useMemo(
    () => scheduleData?.data?.data || scheduleData?.data || {},
    [scheduleData]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          toast.success('Schedule updated');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update schedule');
      },
    }
  );

  const toggleAutoScheduleMutation = useMutation(
    (enabled) => matchingAPI.toggleAutoSchedule(enabled),
    {
      onSuccess: (_, enabled) => {
        queryClient.invalidateQueries('matching-schedule');
        toast.success(enabled ? 'Automatic matching enabled' : 'Automatic matching disabled');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to toggle auto-scheduling');
      },
    }
  );

  const scheduleTypeOptions = [
    { value: 'weekly', label: 'Weekly', description: 'Every week on the same day' },
    { value: 'biweekly', label: 'Bi-weekly', description: 'Every two weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Every month on the same day' },
  ];

  const handleToggle = () => {
    if (!toggleAutoScheduleMutation.isLoading) {
      toggleAutoScheduleMutation.mutate(!config.enabled);
    }
  };

  const handleScheduleTypeChange = (newType) => {
    setShowTypeDropdown(false);
    if (newType !== config.scheduleType) {
      updateScheduleMutation.mutate({
        scheduleType: newType,
        nextRunDate: config.nextRunDate,
      });
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate && config.nextRunDate) {
      const currentDate = new Date(config.nextRunDate);
      const [year, month, day] = newDate.split('-').map(Number);
      const newDateTime = new Date(currentDate);
      newDateTime.setFullYear(year, month - 1, day);

      const now = new Date();
      if (newDateTime > now) {
        updateScheduleMutation.mutate({
          scheduleType: config.scheduleType,
          nextRunDate: newDateTime.toISOString(),
        });
      } else {
        // Check if user selected today - if so, they need to also update the time
        const isToday = newDateTime.toDateString() === now.toDateString();
        if (isToday) {
          toast.error('For today\'s date, please also set a time later than now');
        } else {
          toast.error('Date must be in the future');
        }
      }
    }
    setEditingDate(false);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    if (newTime && config.nextRunDate) {
      const currentDate = new Date(config.nextRunDate);
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDateTime = new Date(currentDate);
      newDateTime.setHours(hours, minutes, 0, 0);

      if (newDateTime > new Date()) {
        updateScheduleMutation.mutate({
          scheduleType: config.scheduleType,
          nextRunDate: newDateTime.toISOString(),
        });
      } else {
        toast.error('Time must be in the future');
      }
    }
    setEditingTime(false);
  };

  const currentTypeOption = scheduleTypeOptions.find(o => o.value === config.scheduleType) || scheduleTypeOptions[2];
  const nextRunDate = config.nextRunDate ? new Date(config.nextRunDate) : null;

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
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-sky-50 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Matching Schedule</h3>
            <p className="text-sm text-gray-500">Configure when automatic matching runs</p>
          </div>
        </div>

        {/* iOS-style Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            aria-label="Toggle automatic matching"
            onClick={handleToggle}
            disabled={toggleAutoScheduleMutation.isLoading}
            data-enabled={config.enabled ? "true" : "false"}
            className="toggle-switch"
          >
            <span className="toggle-switch-knob" />
          </button>
        </div>
      </div>

      {/* Schedule Settings */}
      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Schedule Type */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Schedule Type</span>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  disabled={updateScheduleMutation.isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {currentTypeOption.label}
                  <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showTypeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                    >
                      {scheduleTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleScheduleTypeChange(option.value)}
                          aria-label={`Schedule matching ${option.label.toLowerCase()}`}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                            option.value === config.scheduleType ? 'bg-sky-50' : ''
                          }`}
                        >
                          <div className={`text-sm font-medium ${option.value === config.scheduleType ? 'text-sky-700' : 'text-gray-900'}`}>
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Next Scheduled Run */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Next Run</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Date */}
                <div className="relative">
                  {editingDate ? (
                    <input
                      ref={dateInputRef}
                      type="date"
                      defaultValue={nextRunDate ? format(nextRunDate, 'yyyy-MM-dd') : ''}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={handleDateChange}
                      onBlur={() => setEditingDate(false)}
                      autoFocus
                      className="input text-sm py-1.5 px-3 w-36"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingDate(true);
                        setTimeout(() => dateInputRef.current?.showPicker?.(), 50);
                      }}
                      disabled={updateScheduleMutation.isLoading}
                      className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {nextRunDate ? format(nextRunDate, 'MMM d, yyyy') : 'Not set'}
                    </button>
                  )}
                </div>

                <span className="text-gray-300">|</span>

                {/* Time */}
                <div className="relative">
                  {editingTime ? (
                    <input
                      ref={timeInputRef}
                      type="time"
                      defaultValue={nextRunDate ? format(nextRunDate, 'HH:mm') : '09:00'}
                      onChange={handleTimeChange}
                      onBlur={() => setEditingTime(false)}
                      autoFocus
                      className="input text-sm py-1.5 px-3 w-24"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTime(true);
                        setTimeout(() => timeInputRef.current?.showPicker?.(), 50);
                      }}
                      disabled={updateScheduleMutation.isLoading}
                      className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {nextRunDate ? format(nextRunDate, 'h:mm a') : '9:00 AM'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Helper text */}
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              Matching will run {currentTypeOption.label.toLowerCase()} starting from the scheduled date.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled state message */}
      {!config.enabled && (
        <p className="text-sm text-gray-500 pt-4 border-t border-gray-100">
          Enable automatic matching to configure the schedule.
        </p>
      )}
    </motion.div>
  );
};

export default ScheduleConfig;
