import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
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

  // State for temporary opt-out date
  const [availableFromDate, setAvailableFromDate] = useState('');

  // Initialize date from profile
  useEffect(() => {
    if (profile?.availableFrom) {
      setAvailableFromDate(profile.availableFrom.split('T')[0]);
    } else {
      setAvailableFromDate('');
    }
  }, [profile?.availableFrom]);

  // Set availability mutation
  const setAvailabilityMutation = useMutation(
    (date) => portalAPI.setAvailability(date),
    {
      onSuccess: (_, date) => {
        if (date) {
          toast.success('Temporary break scheduled!');
        } else {
          toast.success('Welcome back! You are now available for matching.');
        }
        queryClient.invalidateQueries('profile');
        queryClient.invalidateQueries('currentPairing');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to set availability');
      },
    }
  );

  // Check if user has a future available_from date
  const isTempOptedOut = profile?.availableFrom && new Date(profile.availableFrom) > new Date();

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
              isTempOptedOut ? (
                <>
                  <div className="flex items-center justify-center w-14 h-14 bg-amber-100 rounded-xl">
                    <ClockIcon className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-700 text-lg">
                      Taking a Break
                    </p>
                    <p className="text-gray-500">
                      You'll return on {new Date(profile.availableFrom).toLocaleDateString()}
                    </p>
                  </div>
                </>
              ) : (
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
              )
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
            isTempOptedOut ? (
              <button
                onClick={() => setAvailabilityMutation.mutate(null)}
                disabled={setAvailabilityMutation.isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transition-all disabled:opacity-50"
              >
                {setAvailabilityMutation.isLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Come Back Early'
                )}
              </button>
            ) : (
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
            )
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

      {/* Temporary Break Section - only show for opted-in users */}
      {profile?.isOptedIn && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Schedule a Break
              </h3>
              <p className="text-sm text-gray-500">
                Going on holiday or need some time off? Set a date when you'll be back.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available from
              </label>
              <input
                type="date"
                value={availableFromDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAvailableFromDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                You won't be matched until this date
              </p>
            </div>

            <div className="flex gap-2">
              {availableFromDate && (
                <button
                  onClick={() => {
                    setAvailableFromDate('');
                    if (profile?.availableFrom) {
                      setAvailabilityMutation.mutate(null);
                    }
                  }}
                  disabled={setAvailabilityMutation.isLoading}
                  className="px-4 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setAvailabilityMutation.mutate(availableFromDate)}
                disabled={!availableFromDate || setAvailabilityMutation.isLoading || availableFromDate === profile?.availableFrom?.split('T')[0]}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setAvailabilityMutation.isLoading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Set Break'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default Profile;
