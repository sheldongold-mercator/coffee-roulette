import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { portalAPI } from '../../services/portalAPI';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    color: 'text-amber-600 bg-amber-100',
  },
  confirmed: {
    label: 'Scheduled',
    icon: CalendarIcon,
    color: 'text-blue-600 bg-blue-100',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircleIcon,
    color: 'text-green-600 bg-green-100',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircleIcon,
    color: 'text-gray-500 bg-gray-100',
  },
};

const PairingHistory = () => {
  const { data, isLoading } = useQuery(
    'pairingHistory',
    () => portalAPI.getPairingHistory({ limit: 50 }),
    { staleTime: 30000 }
  );

  const pairings = data?.data?.pairings || [];
  const totalRounds = data?.data?.totalRounds || 0;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-amber-100 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-amber-50 rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-amber-100 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-40 bg-amber-100 rounded" />
                  <div className="h-4 w-32 bg-amber-50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Coffee Journey
        </h1>
        <p className="text-gray-600 text-lg">
          {pairings.length > 0
            ? `You've had ${pairings.filter((p) => p.status === 'completed').length} coffee chats so far`
            : 'Your coffee history will appear here'}
        </p>
      </motion.div>

      {/* Stats Cards */}
      {pairings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
            <div className="text-3xl font-bold text-amber-600">
              {pairings.length}
            </div>
            <div className="text-sm text-gray-600">Total Matches</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
            <div className="text-3xl font-bold text-green-600">
              {pairings.filter((p) => p.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
            <div className="text-3xl font-bold text-blue-600">
              {new Set(pairings.map((p) => p.partner?.id)).size}
            </div>
            <div className="text-sm text-gray-600">Colleagues Met</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
            <div className="text-3xl font-bold text-purple-600">
              {totalRounds}
            </div>
            <div className="text-sm text-gray-600">Rounds</div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {pairings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6">
            <ClockIcon className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No coffee chats yet
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Once you're matched with a colleague, your coffee history will appear
            here. Stay tuned for your first match!
          </p>
        </motion.div>
      )}

      {/* Pairing Timeline */}
      {pairings.length > 0 && (
        <div className="space-y-4">
          {pairings.map((pairing, index) => {
            const status = statusConfig[pairing.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const initials = `${pairing.partner?.firstName?.charAt(0) || ''}${pairing.partner?.lastName?.charAt(0) || ''}`;

            return (
              <motion.div
                key={pairing.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-amber-100 hover:shadow-lg hover:shadow-amber-100/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Partner Avatar */}
                  <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-white text-lg font-bold shadow-md group-hover:shadow-lg transition-shadow">
                    {initials || <UserIcon className="w-6 h-6" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {pairing.partner?.firstName} {pairing.partner?.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {pairing.partner?.role && (
                            <span className="capitalize">{pairing.partner.role}</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {pairing.round?.name && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {pairing.round.name}
                        </span>
                      )}
                      {pairing.meetingScheduledAt && (
                        <span>
                          {new Date(pairing.meetingScheduledAt).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </span>
                      )}
                    </div>

                    {/* Icebreakers preview */}
                    {pairing.icebreakers?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {pairing.icebreakers.slice(0, 2).map((ib) => (
                          <span
                            key={ib.id}
                            className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-sm rounded-full truncate max-w-xs"
                          >
                            {ib.topic}
                          </span>
                        ))}
                        {pairing.icebreakers.length > 2 && (
                          <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-sm rounded-full">
                            +{pairing.icebreakers.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PairingHistory;
