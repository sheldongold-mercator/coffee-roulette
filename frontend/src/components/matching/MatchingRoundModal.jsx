import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { matchingAPI } from '../../services/api';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-100' },
  confirmed: { label: 'Scheduled', color: 'text-blue-600 bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-600 bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-100' },
};

const MatchingRoundModal = ({ roundId, onClose }) => {
  const { data: roundData, isLoading } = useQuery(
    ['matching-round', roundId],
    () => matchingAPI.getRoundById(roundId),
    { enabled: !!roundId }
  );

  const apiResponse = roundData?.data || roundData;
  const round = apiResponse?.round;
  const pairings = apiResponse?.pairings || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
              <UsersIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isLoading ? 'Loading...' : round?.name || `Round #${roundId}`}
              </h2>
              {round && (
                <p className="text-sm text-gray-500">
                  {format(new Date(round.createdAt), 'MMMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-sm">Participants</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {round?.totalParticipants || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-sm">Pairings</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {pairings.length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <p className="text-lg font-semibold text-green-600 capitalize">
                    {round?.status || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Pairings List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pairings
                </h3>
                {pairings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No pairings in this round
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pairings.map((pairing) => (
                      <div
                        key={pairing.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4 flex-1">
                            {/* User 1 */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full text-primary-700 font-semibold">
                                {pairing.user1?.firstName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {pairing.user1?.firstName} {pairing.user1?.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {pairing.user1?.department || 'No department'}
                                </p>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center justify-center w-8">
                              <span className="text-gray-400 text-lg">↔</span>
                            </div>

                            {/* User 2 */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full text-orange-700 font-semibold">
                                {pairing.user2?.firstName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {pairing.user2?.firstName} {pairing.user2?.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {pairing.user2?.department || 'No department'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusConfig[pairing.status]?.color || 'text-gray-600 bg-gray-100'
                              }`}
                            >
                              {statusConfig[pairing.status]?.label || pairing.status}
                            </span>
                          </div>
                        </div>

                        {/* Meeting Info */}
                        {pairing.meetingScheduledAt && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              Meeting: {format(new Date(pairing.meetingScheduledAt), 'MMM d, yyyy h:mm a')}
                            </span>
                            {pairing.meetingCompletedAt && (
                              <span className="text-green-600 ml-2">
                                (Completed)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Icebreakers */}
                        {pairing.icebreakers && pairing.icebreakers.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <ChatBubbleLeftIcon className="w-4 h-4" />
                              <span>Conversation starters:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {pairing.icebreakers.map((ib) => (
                                <span
                                  key={ib.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                                >
                                  {ib.topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MatchingRoundModal;
