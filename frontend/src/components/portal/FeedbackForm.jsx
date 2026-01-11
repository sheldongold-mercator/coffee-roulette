import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { portalAPI } from '../../services/portalAPI';

const FeedbackForm = ({ pairingId, partnerName, existingFeedback, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState(existingFeedback?.comments || '');
  const [topicsDiscussed, setTopicsDiscussed] = useState(existingFeedback?.topicsDiscussed || '');
  const isEditing = !!existingFeedback;

  const submitMutation = useMutation(
    (data) => portalAPI.submitFeedback(pairingId, data),
    {
      onSuccess: () => {
        toast.success('Thanks for your feedback!');
        queryClient.invalidateQueries('currentPairing');
        queryClient.invalidateQueries('pairingHistory');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit feedback');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitMutation.mutate({
      rating,
      comments: comments.trim() || null,
      topicsDiscussed: topicsDiscussed.trim() || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Update Feedback' : 'How was it?'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Update your experience with' : 'Share your experience with'} {partnerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Experience
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    {(hoverRating || rating) >= star ? (
                      <StarIconSolid className="w-10 h-10 text-amber-400" />
                    ) : (
                      <StarIcon className="w-10 h-10 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {rating === 0 && 'Tap to rate'}
                {rating === 1 && 'Not great'}
                {rating === 2 && 'Could be better'}
                {rating === 3 && 'It was okay'}
                {rating === 4 && 'Pretty good!'}
                {rating === 5 && 'Awesome!'}
              </p>
            </div>

            {/* Topics Discussed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What did you talk about?
              </label>
              <input
                type="text"
                value={topicsDiscussed}
                onChange={(e) => setTopicsDiscussed(e.target.value)}
                placeholder="e.g., Work projects, hobbies, travel..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any other thoughts? (optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share what made this coffee chat memorable..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitMutation.isLoading || rating === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </span>
              ) : (
                isEditing ? 'Update Feedback' : 'Submit Feedback'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackForm;
