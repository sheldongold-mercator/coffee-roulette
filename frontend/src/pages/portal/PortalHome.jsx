import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { portalAPI } from '../../services/portalAPI';
import PartnerCard from '../../components/portal/PartnerCard';
import IcebreakerList from '../../components/portal/IcebreakerList';
import EmptyState from '../../components/portal/EmptyState';
import FeedbackForm from '../../components/portal/FeedbackForm';
import toast from 'react-hot-toast';

const PortalHome = () => {
  const queryClient = useQueryClient();
  const [showFeedback, setShowFeedback] = useState(false);

  // Fetch current pairing
  const { data: pairingData, isLoading: pairingLoading } = useQuery(
    'currentPairing',
    () => portalAPI.getCurrentPairing(),
    { staleTime: 30000 }
  );

  // Fetch user profile for opt-in status
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'profile',
    () => portalAPI.getProfile(),
    { staleTime: 60000 }
  );

  // Confirm meeting mutation
  const confirmMutation = useMutation(
    (pairingId) => portalAPI.confirmMeeting(pairingId),
    {
      onSuccess: () => {
        toast.success('Meeting confirmed! Time to share your feedback.');
        queryClient.invalidateQueries('currentPairing');
        setShowFeedback(true);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to confirm meeting');
      },
    }
  );

  const pairing = pairingData?.data?.pairing;
  const profile = profileData?.data?.user;
  const isLoading = pairingLoading || profileLoading;

  // Format meeting date
  const formatMeetingDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-amber-100 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-amber-50 rounded" />
        </div>
        {/* Card skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden animate-pulse">
          <div className="h-20 bg-gradient-to-r from-amber-100 to-orange-100" />
          <div className="p-6 space-y-4">
            <div className="flex items-end gap-4 -mt-14">
              <div className="w-20 h-20 bg-amber-200 rounded-2xl" />
              <div className="space-y-2 pb-1">
                <div className="h-6 w-40 bg-amber-100 rounded" />
                <div className="h-4 w-24 bg-amber-50 rounded" />
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full bg-amber-50 rounded" />
              <div className="h-4 w-3/4 bg-amber-50 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No pairing - show empty state
  if (!pairing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EmptyState isOptedIn={profile?.isOptedIn} />
      </div>
    );
  }

  const isPending = pairing.status === 'pending';
  const isConfirmed = pairing.status === 'confirmed';
  const isCompleted = pairing.status === 'completed';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Decorative background blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-medium mb-4"
          >
            <SparklesIcon className="w-4 h-4" />
            {isPending && "You've been matched!"}
            {isConfirmed && 'Meeting scheduled'}
            {isCompleted && 'Coffee chat completed'}
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPending && 'Time for Coffee!'}
            {isConfirmed && 'Your Coffee Date'}
            {isCompleted && 'Hope it went well!'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isPending && `Reach out to ${pairing.partner?.firstName} and schedule your chat`}
            {isConfirmed && `Don't forget your meeting with ${pairing.partner?.firstName}`}
            {isCompleted && `Share how your coffee with ${pairing.partner?.firstName} went`}
          </p>
        </div>
      </motion.div>

      {/* Meeting Schedule Banner */}
      {pairing.meetingScheduledAt && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl"
        >
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
            <CalendarDaysIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Scheduled for</p>
            <p className="text-lg font-semibold text-green-900">
              {formatMeetingDate(pairing.meetingScheduledAt)}
            </p>
          </div>
          {!isCompleted && (
            <a
              href={`https://outlook.office.com/calendar`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-green-700 font-medium rounded-xl border border-green-200 hover:bg-green-50 transition-colors"
            >
              View Calendar
            </a>
          )}
        </motion.div>
      )}

      {/* Partner Card - Full Width */}
      <PartnerCard partner={pairing.partner} />

      {/* Icebreakers - Only show if available */}
      {pairing.icebreakers && pairing.icebreakers.length > 0 && (
        <IcebreakerList icebreakers={pairing.icebreakers} />
      )}

      {/* How It Works - Show for pending pairings to help new users */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border border-amber-100 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm">
              <span className="text-xl">&#128161;</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                How Coffee Roulette Works
              </h4>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">1.</span>
                  <span>Reach out to your partner via email or Teams</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">2.</span>
                  <span>Schedule a 30-minute coffee chat together</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">3.</span>
                  <span>Meet up virtually or in-person - your choice!</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">4.</span>
                  <span>Click "We Had Our Coffee" when you're done</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {!isCompleted ? (
          <button
            onClick={() => confirmMutation.mutate(pairing.id)}
            disabled={confirmMutation.isLoading}
            className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {confirmMutation.isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-6 h-6" />
                We Had Our Coffee!
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowFeedback(true)}
            className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transform hover:-translate-y-0.5 transition-all"
          >
            <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            {pairing.feedback ? 'Change Feedback' : 'Share Your Feedback'}
          </button>
        )}
      </motion.div>

      {/* Completed State - Encouragement */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 px-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl border border-amber-100"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-4">
            <span className="text-3xl">&#127881;</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Great job connecting!
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Building connections makes our workplace better. Check your history
            to see all your past coffee chats, and stay tuned for your next match!
          </p>
        </motion.div>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackForm
            pairingId={pairing.id}
            partnerName={pairing.partner?.firstName}
            existingFeedback={pairing.feedback}
            onClose={() => setShowFeedback(false)}
            onSuccess={() => setShowFeedback(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortalHome;
