import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { matchingAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Matching = () => {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  const { data: roundsData, isLoading } = useQuery(['matching-rounds', 'v2'], () =>
    matchingAPI.getRounds({ limit: 10 })
  );

  const { data: eligibleData } = useQuery(['matching-eligible', 'v2'], () =>
    matchingAPI.getEligibleCount()
  );

  const { data: previewData, isLoading: previewLoading } = useQuery(
    ['matching-preview', 'v2'],
    () => matchingAPI.previewMatching(),
    { enabled: showPreview }
  );

  const runMatchingMutation = useMutation(
    (data) => matchingAPI.runMatching(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('matching-rounds');
        queryClient.invalidateQueries('analytics-overview');
        toast.success('Matching round completed successfully!');
        setShowPreview(false);
      },
      onError: () => {
        toast.error('Failed to run matching round');
      },
    }
  );

  const handleRunMatching = () => {
    if (window.confirm('Are you sure you want to run a new matching round?')) {
      runMatchingMutation.mutate({});
    }
  };

  // Handle axios response wrapper: response.data.data
  const rounds = Array.isArray(roundsData?.data?.data)
    ? roundsData.data.data
    : Array.isArray(roundsData?.data?.rounds)
    ? roundsData.data.rounds
    : Array.isArray(roundsData?.data)
    ? roundsData.data
    : [];
  const eligibleCount = eligibleData?.data?.data?.count || eligibleData?.data?.count || 0;
  const preview = previewData?.data?.data || previewData?.data?.preview || previewData?.preview || null;

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
            {showPreview ? 'Hide Preview' : 'Preview Matching'}
          </button>
          <button
            onClick={handleRunMatching}
            disabled={runMatchingMutation.isLoading}
            className="btn btn-primary"
          >
            {runMatchingMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Running...</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5" />
                <span>Run Matching</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

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
          ) : preview ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Preview of potential pairings. This does not create actual pairings.
              </p>
              <div className="space-y-2">
                {preview.pairings?.map((pairing, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {pairing.user1Name}
                      </span>
                      <span className="text-gray-400">↔</span>
                      <span className="text-sm font-medium text-gray-900">
                        {pairing.user2Name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Score: {pairing.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No preview data available
            </p>
          )}
        </motion.div>
      )}

      {/* Rounds History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card overflow-hidden p-0"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Matching History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Round ID</th>
                <th>Date</th>
                <th>Total Pairings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div className="h-10 bg-gray-200 animate-shimmer rounded"></div>
                    </td>
                  </tr>
                ))
              ) : rounds.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
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
                    <td className="text-gray-600">{round.totalPairings || 0}</td>
                    <td>
                      <span className="badge badge-success">Completed</span>
                    </td>
                    <td>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
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
    </div>
  );
};

export default Matching;
