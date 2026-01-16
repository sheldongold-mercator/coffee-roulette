import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { matchingAPI } from '../services/api';
import { format } from 'date-fns';
import MatchingRoundModal from '../components/matching/MatchingRoundModal';
import ScheduleConfig from '../components/matching/ScheduleConfig';
import ManualMatchingModal from '../components/matching/ManualMatchingModal';

const Matching = () => {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Build filter params
  const filterParams = {
    limit: 50,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter && { status: statusFilter }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  };

  const hasActiveFilters = searchTerm || statusFilter || dateFrom || dateTo;

  const { data: roundsData, isLoading } = useQuery(
    ['matching-rounds', 'v2', filterParams],
    () => matchingAPI.getRounds(filterParams)
  );

  const { data: eligibleData } = useQuery(['matching-eligible', 'v2'], () =>
    matchingAPI.getEligibleCount()
  );

  const { data: scheduleData } = useQuery(['matching-schedule'], () =>
    matchingAPI.getSchedule()
  );

  const { data: previewData, isLoading: previewLoading } = useQuery(
    ['matching-preview', 'v2'],
    () => matchingAPI.previewMatching(),
    { enabled: showPreview }
  );

  // Handle axios response wrapper: response.data.data
  const rounds = Array.isArray(roundsData?.data?.data)
    ? roundsData.data.data
    : Array.isArray(roundsData?.data?.rounds)
    ? roundsData.data.rounds
    : Array.isArray(roundsData?.data)
    ? roundsData.data
    : [];
  const eligibleCount = eligibleData?.data?.data?.count || eligibleData?.data?.count || 0;
  const previewInfo = previewData?.data?.preview || previewData?.preview || null;
  const previewPairings = previewData?.data?.pairings || previewData?.pairings || [];
  const scheduleConfig = scheduleData?.data?.data || scheduleData?.data || {};
  const nextRunDate = scheduleConfig.enabled && scheduleConfig.nextRunDate
    ? new Date(scheduleConfig.nextRunDate)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matching</h1>
          <p className="mt-2 text-gray-600">
            Manage pairing rounds and matching algorithm
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-secondary"
          >
            <EyeIcon className="w-5 h-5" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="btn btn-primary"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            <span>Manual Match</span>
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-lg">
              <UsersIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Eligible Users</p>
              <p className="text-2xl font-bold text-gray-900">{eligibleCount}</p>
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
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Rounds</p>
              <p className="text-2xl font-bold text-gray-900">{rounds.length}</p>
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
              <CheckCircleIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Round</p>
              <p className="text-lg font-bold text-gray-900">
                {rounds.length > 0
                  ? format(new Date(rounds[0].createdAt), 'MMM d, yyyy')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-sky-50 rounded-lg">
              <CalendarDaysIcon className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Round</p>
              <p className="text-lg font-bold text-gray-900">
                {nextRunDate
                  ? format(nextRunDate, 'MMM d, yyyy')
                  : 'Schedule not set'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Schedule Configuration */}
      <ScheduleConfig />

      {/* Preview */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Matching Preview
          </h2>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : previewPairings.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Preview of potential pairings ({previewInfo?.totalParticipants || 0} participants, {previewPairings.length} pairings). This does not create actual pairings.
              </p>
              <div className="space-y-2">
                {previewPairings.map((pairing, index) => (
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
                      <span className="text-gray-400">↔</span>
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
              {previewInfo?.unpaired && (
                <p className="text-sm text-amber-600 mt-4">
                  Note: {previewInfo.unpaired.firstName} {previewInfo.unpaired.lastName} will sit out this round (odd number of participants)
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No preview data available. Need at least 2 eligible participants.
            </p>
          )}
        </motion.div>
      )}

      {/* Rounds History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card overflow-hidden p-0"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Matching History
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-sm ${hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-primary-600 rounded-full">
                  {[searchTerm, statusFilter, dateFrom, dateTo].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Participant
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name or email..."
                      className="input pl-9"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Round ID</th>
                <th>Date</th>
                <th>Source</th>
                <th>Total Pairings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="h-10 bg-gray-200 animate-shimmer rounded"></div>
                    </td>
                  </tr>
                ))
              ) : rounds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No matching rounds yet
                  </td>
                </tr>
              ) : (
                rounds.map((round) => (
                  <tr key={round.id}>
                    <td className="font-medium text-gray-900">
                      #{round.id}
                    </td>
                    <td className="text-gray-600">
                      {format(new Date(round.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td>
                      <span className={`badge ${
                        round.source === 'manual' ? 'badge-info' :
                        round.source === 'scheduled' ? 'badge-secondary' :
                        'badge-warning'
                      }`}>
                        {round.source === 'manual' ? 'Manual' :
                         round.source === 'scheduled' ? 'Scheduled' :
                         'Legacy'}
                      </span>
                    </td>
                    <td className="text-gray-600">{round.totalPairings || 0}</td>
                    <td>
                      <span className="badge badge-success">Completed</span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedRoundId(round.id)}
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
      </motion.div>

      {/* Round Detail Modal */}
      {selectedRoundId && (
        <MatchingRoundModal
          roundId={selectedRoundId}
          onClose={() => setSelectedRoundId(null)}
        />
      )}

      {/* Manual Matching Modal */}
      <ManualMatchingModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries('matching-rounds');
          queryClient.invalidateQueries('matching-schedule');
          queryClient.invalidateQueries('analytics-overview');
        }}
      />
    </div>
  );
};

export default Matching;
