import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  FunnelIcon,
  Cog6ToothIcon,
  EyeIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { matchingAPI, departmentAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SENIORITY_LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'head', label: 'Head' },
  { value: 'executive', label: 'Executive' },
];

const ManualMatchingModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState({
    departmentIds: [],
    seniorityLevels: [],
  });
  const [options, setOptions] = useState({
    ignoreRecentHistory: false,
    resetAutoSchedule: false,
  });
  const [matchingName, setMatchingName] = useState('');
  const [previewData, setPreviewData] = useState(null);

  // Fetch departments for filter selection
  const { data: departmentsData } = useQuery(
    ['departments'],
    () => departmentAPI.getDepartments(),
    { enabled: isOpen }
  );

  // Preview mutation
  const previewMutation = useMutation(
    (data) => matchingAPI.previewWithFilters(data),
    {
      onSuccess: (response) => {
        const data = response?.data || response;
        setPreviewData(data);
        setStep(3);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to preview matching');
      },
    }
  );

  // Run matching mutation
  const runMatchingMutation = useMutation(
    (data) => matchingAPI.runManualMatching(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('matching-rounds');
        queryClient.invalidateQueries('matching-schedule');
        queryClient.invalidateQueries('analytics-overview');
        setStep(4);
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to run matching');
      },
    }
  );

  const departments = Array.isArray(departmentsData?.data?.data)
    ? departmentsData.data.data
    : Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : [];

  const handleDepartmentToggle = (deptId) => {
    setFilters((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId],
    }));
  };

  const handleSeniorityToggle = (level) => {
    setFilters((prev) => ({
      ...prev,
      seniorityLevels: prev.seniorityLevels.includes(level)
        ? prev.seniorityLevels.filter((l) => l !== level)
        : [...prev.seniorityLevels, level],
    }));
  };

  const buildFilterData = () => {
    const filterData = {};
    if (filters.departmentIds.length > 0) {
      filterData.departmentIds = filters.departmentIds;
    }
    if (filters.seniorityLevels.length > 0) {
      filterData.seniorityLevels = filters.seniorityLevels;
    }
    return Object.keys(filterData).length > 0 ? filterData : null;
  };

  const handlePreview = () => {
    previewMutation.mutate({
      filters: buildFilterData(),
      options: {
        ignoreRecentHistory: options.ignoreRecentHistory,
      },
    });
  };

  const handleRunMatching = () => {
    runMatchingMutation.mutate({
      name: matchingName || undefined,
      filters: buildFilterData(),
      options: {
        ignoreRecentHistory: options.ignoreRecentHistory,
        resetAutoSchedule: options.resetAutoSchedule,
      },
    });
  };

  const handleClose = () => {
    setStep(1);
    setFilters({ departmentIds: [], seniorityLevels: [] });
    setOptions({ ignoreRecentHistory: false, resetAutoSchedule: false });
    setMatchingName('');
    setPreviewData(null);
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, label: 'Filters', icon: FunnelIcon },
    { number: 2, label: 'Options', icon: Cog6ToothIcon },
    { number: 3, label: 'Preview', icon: EyeIcon },
    { number: 4, label: 'Complete', icon: CheckCircleIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Manual Matching
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => (
                <React.Fragment key={s.number}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        step >= s.number
                          ? 'bg-sky-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      <s.icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-sm ${
                        step >= s.number ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        step > s.number ? 'bg-sky-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Filters */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Select Filters
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Choose which users to include in this matching round. Leave empty to include all eligible users.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departments
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {departments.map((dept) => (
                        <button
                          key={dept.id}
                          onClick={() => handleDepartmentToggle(dept.id)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            filters.departmentIds.includes(dept.id)
                              ? 'bg-sky-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {dept.name}
                        </button>
                      ))}
                    </div>
                    {filters.departmentIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {filters.departmentIds.length} department(s) selected
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seniority Levels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SENIORITY_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => handleSeniorityToggle(level.value)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            filters.seniorityLevels.includes(level.value)
                              ? 'bg-sky-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                    {filters.seniorityLevels.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {filters.seniorityLevels.length} seniority level(s) selected
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Round Name (optional)
                    </label>
                    <input
                      type="text"
                      value={matchingName}
                      onChange={(e) => setMatchingName(e.target.value)}
                      placeholder="e.g., Q1 Sales Team Kickoff"
                      className="input"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Options */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Matching Options
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Configure how this manual matching should behave.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={options.ignoreRecentHistory}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            ignoreRecentHistory: e.target.checked,
                          }))
                        }
                        className="mt-1 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          Ignore recent pairing history
                        </div>
                        <div className="text-sm text-gray-500">
                          Allow users to be paired even if they were matched recently. Useful for team-specific events.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={options.resetAutoSchedule}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            resetAutoSchedule: e.target.checked,
                          }))
                        }
                        className="mt-1 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          Reset auto-schedule timer
                        </div>
                        <div className="text-sm text-gray-500">
                          Treat this manual run as the scheduled run, adjusting the next automatic matching date accordingly.
                        </div>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Preview */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Preview Results
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Review the pairings before confirming.
                    </p>
                  </div>

                  {previewMutation.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                    </div>
                  ) : previewData ? (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {previewData.preview?.totalParticipants || 0}
                          </div>
                          <div className="text-xs text-gray-500">Participants</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {previewData.preview?.totalPairings || 0}
                          </div>
                          <div className="text-xs text-gray-500">Pairings</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {previewData.preview?.unpaired ? 1 : 0}
                          </div>
                          <div className="text-xs text-gray-500">Unpaired</div>
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {previewData.pairings?.map((pairing, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {pairing.user1?.firstName} {pairing.user1?.lastName}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({pairing.user1?.department})
                                </span>
                              </div>
                              <span className="text-gray-400">-</span>
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {pairing.user2?.firstName} {pairing.user2?.lastName}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({pairing.user2?.department})
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              Score: {pairing.score}
                            </span>
                          </div>
                        ))}
                      </div>

                      {previewData.preview?.unpaired && (
                        <p className="text-sm text-amber-600 mt-4">
                          Note: {previewData.preview.unpaired.firstName}{' '}
                          {previewData.preview.unpaired.lastName} will sit out this round
                          (odd number of participants)
                        </p>
                      )}
                    </>
                  ) : null}
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Matching Complete!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Successfully created {previewData?.preview?.totalPairings || 0} pairings.
                  </p>
                  <button onClick={handleClose} className="btn btn-primary">
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {step < 4 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                disabled={step === 1}
                className={`btn btn-secondary ${
                  step === 1 ? 'invisible' : ''
                }`}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>

              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 2) {
                      handlePreview();
                    } else {
                      setStep((prev) => prev + 1);
                    }
                  }}
                  disabled={previewMutation.isLoading}
                  className="btn btn-primary"
                >
                  {step === 2 ? (
                    previewMutation.isLoading ? (
                      'Loading Preview...'
                    ) : (
                      <>
                        Preview
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )
                  ) : (
                    <>
                      Next
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : step === 3 ? (
                <button
                  onClick={handleRunMatching}
                  disabled={runMatchingMutation.isLoading}
                  className="btn btn-primary"
                >
                  {runMatchingMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Running...
                    </>
                  ) : (
                    'Confirm & Run Matching'
                  )}
                </button>
              ) : null}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ManualMatchingModal;
