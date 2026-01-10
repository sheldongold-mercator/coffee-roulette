import React from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const categoryColors = {
  work: 'bg-blue-100 text-blue-700 border-blue-200',
  hobbies: 'bg-green-100 text-green-700 border-green-200',
  fun: 'bg-purple-100 text-purple-700 border-purple-200',
  career: 'bg-amber-100 text-amber-700 border-amber-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

const IcebreakerList = ({ icebreakers = [] }) => {
  if (icebreakers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Conversation Starters</h3>
          <p className="text-sm text-gray-500">Some ideas to break the ice</p>
        </div>
      </div>

      <div className="space-y-3">
        {icebreakers.map((icebreaker, index) => (
          <motion.div
            key={icebreaker.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-full text-amber-600 font-bold text-sm shadow-sm">
              {index + 1}
            </span>
            <div className="flex-1">
              <p className="text-gray-800">{icebreaker.topic}</p>
              {icebreaker.category && (
                <span
                  className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full border ${
                    categoryColors[icebreaker.category] || categoryColors.default
                  }`}
                >
                  {icebreaker.category}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default IcebreakerList;
