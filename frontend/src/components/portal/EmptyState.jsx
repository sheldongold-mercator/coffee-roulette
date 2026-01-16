import React from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { portalAPI } from '../../services/portalAPI';

const EmptyState = ({ isOptedIn, onOptInSuccess }) => {
  const queryClient = useQueryClient();

  const optInMutation = useMutation(() => portalAPI.optIn(), {
    onSuccess: () => {
      toast.success('Welcome to Coffee Roulette!');
      queryClient.invalidateQueries('profile');
      queryClient.invalidateQueries('currentPairing');
      if (onOptInSuccess) onOptInSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to opt in');
    },
  });

  // How it works section - shared between states
  const HowItWorks = () => (
    <div className="mt-6 sm:mt-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl sm:rounded-2xl border border-amber-100 p-4 sm:p-6 text-left max-w-lg mx-auto">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl shadow-sm">
          <span className="text-lg sm:text-xl">&#128161;</span>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
            How Coffee Roulette Works
          </h4>
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">1.</span>
              <span>You get matched with a random colleague each month</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">2.</span>
              <span>Reach out via email or Teams to schedule a chat</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">3.</span>
              <span>Meet for 30 minutes - virtual or in-person</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">4.</span>
              <span>Mark your meeting complete and share feedback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOptedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 sm:py-12 px-4 sm:px-6"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-4 sm:mb-6">
          <span className="text-4xl sm:text-5xl">&#9749;</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
          Join Coffee Roulette!
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-4 sm:mb-6">
          Get matched with a colleague each month for a casual coffee chat.
          It's a great way to meet people from other teams and build connections
          across the company.
        </p>
        <HowItWorks />
        <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8">
          <button
            onClick={() => optInMutation.mutate()}
            disabled={optInMutation.isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {optInMutation.isLoading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <span className="text-lg sm:text-xl">&#9749;</span>
                Count Me In!
              </>
            )}
          </button>
          <p className="text-xs sm:text-sm text-gray-500">
            You can opt out at any time from your profile
          </p>
        </div>
      </motion.div>
    );
  }

  // Opted in but no current pairing
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 sm:py-12 px-4 sm:px-6"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-4 sm:mb-6">
        <span className="text-4xl sm:text-5xl">&#128522;</span>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
        You're All Set!
      </h2>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-4 sm:mb-6">
        You're enrolled in Coffee Roulette. When the next matching round happens,
        you'll be paired with a colleague and notified via email.
      </p>
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
        Waiting for next match
      </div>
      <HowItWorks />
    </motion.div>
  );
};

export default EmptyState;
