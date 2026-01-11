import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { portalAPI } from '../../services/portalAPI';
import toast from 'react-hot-toast';

const Profile = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('profile', () => portalAPI.getProfile());

  const profile = data?.data?.user;

  // Opt-in mutation
  const optInMutation = useMutation(() => portalAPI.optIn(), {
    onSuccess: () => {
      toast.success('Welcome back to Coffee Roulette!');
      queryClient.invalidateQueries('profile');
      queryClient.invalidateQueries('currentPairing');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to opt in');
    },
  });

  // Opt-out mutation
  const optOutMutation = useMutation(() => portalAPI.optOut(), {
    onSuccess: () => {
      toast.success("You've opted out. You can rejoin anytime!");
      queryClient.invalidateQueries('profile');
      queryClient.invalidateQueries('currentPairing');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to opt out');
    },
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-amber-100 rounded-lg" />
        <div className="bg-white rounded-2xl p-8 border border-amber-100">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-amber-100 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-amber-100 rounded" />
              <div className="h-4 w-32 bg-amber-50 rounded" />
            </div>
          </div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600 text-lg">
          Manage your Coffee Roulette preferences
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-24" />
        <div className="px-8 pb-8 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-8">
            <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white text-3xl font-bold shadow-lg shadow-amber-200 border-4 border-white">
              {profile?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="pb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <span>{profile?.email}</span>
              </div>
              {profile?.department?.name && (
                <div className="flex items-center gap-3 text-gray-600">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                  <span>{profile.department.name}</span>
                </div>
              )}
              {profile?.role && (
                <div className="flex items-center gap-3 text-gray-600">
                  <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                  <span className="capitalize">{profile.role}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Participation Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Coffee Roulette Status
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {profile?.isOptedIn ? (
              <>
                <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl">
                  <CheckCircleIcon className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 text-lg">
                    You're In!
                  </p>
                  <p className="text-gray-500">
                    You'll be matched in upcoming rounds
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-14 h-14 bg-gray-100 rounded-xl">
                  <XCircleIcon className="w-7 h-7 text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-lg">
                    Currently Opted Out
                  </p>
                  <p className="text-gray-500">
                    You won't be included in matching rounds
                  </p>
                </div>
              </>
            )}
          </div>

          {profile?.isOptedIn ? (
            <button
              onClick={() => optOutMutation.mutate()}
              disabled={optOutMutation.isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {optOutMutation.isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Opt Out'
              )}
            </button>
          ) : (
            <button
              onClick={() => optInMutation.mutate()}
              disabled={optInMutation.isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transition-all disabled:opacity-50"
            >
              {optInMutation.isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-lg">&#9749;</span>
                  Join Coffee Roulette
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

    </div>
  );
};

export default Profile;
