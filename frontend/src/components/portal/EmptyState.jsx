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

  if (!isOptedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 px-6"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6">
          <span className="text-5xl">&#9749;</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Join Coffee Roulette!
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Get matched with a colleague each month for a casual coffee chat.
          It's a great way to meet people from other teams and build connections
          across the company.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => optInMutation.mutate()}
            disabled={optInMutation.isLoading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {optInMutation.isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <span className="text-xl">&#9749;</span>
                Count Me In!
              </>
            )}
          </button>
          <p className="text-sm text-gray-500">
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
      className="text-center py-12 px-6"
    >
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6">
        <span className="text-5xl">&#128522;</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        You're All Set!
      </h2>
      <p className="text-gray-600 max-w-md mx-auto mb-6">
        You're enrolled in Coffee Roulette. When the next matching round happens,
        you'll be paired with a colleague and notified via email.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Waiting for next match
      </div>
    </motion.div>
  );
};

export default EmptyState;
