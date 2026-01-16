import React from 'react';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

const PartnerCard = ({ partner }) => {
  if (!partner) return null;

  const initials = `${partner.firstName?.charAt(0) || ''}${partner.lastName?.charAt(0) || ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-amber-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-14 sm:h-20" />
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 -mt-7 sm:-mt-10">
        <div className="flex items-end gap-3 sm:gap-4 mb-4">
          <div className="flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl text-white text-xl sm:text-2xl font-bold shadow-lg shadow-amber-200 border-4 border-white flex-shrink-0">
            {initials}
          </div>
          <div className="pb-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {partner.firstName} {partner.lastName}
            </h3>
            <p className="text-sm sm:text-base text-amber-600 font-medium">Your Coffee Partner</p>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {partner.department && (
            <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
              <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{partner.department}</span>
            </div>
          )}
          {partner.role && (
            <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
              <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              <span className="capitalize truncate">{partner.role}</span>
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
            <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <a
              href={`mailto:${partner.email}`}
              className="text-amber-600 hover:text-amber-700 hover:underline truncate"
            >
              {partner.email}
            </a>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <a
            href={`mailto:${partner.email}?subject=${encodeURIComponent("Coffee Roulette - Let's meet!")}&body=${encodeURIComponent(`Hi ${partner.firstName},\n\nI was matched with you for this round of Coffee Roulette! Would you like to schedule a time for a coffee chat?\n\nLooking forward to meeting you!`)}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm sm:text-base font-medium rounded-xl hover:shadow-lg hover:shadow-amber-200 transition-all"
          >
            <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Send Email
          </a>
          <a
            href={`https://teams.microsoft.com/l/chat/0/0?users=${partner.email}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[#5558AF] text-white text-sm sm:text-base font-medium rounded-xl hover:bg-[#4B4E9B] transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.625 8.5h-3.75a.375.375 0 01-.375-.375V4.5c0-1.036.84-1.875 1.875-1.875h.375c1.036 0 1.875.84 1.875 1.875v3.625a.375.375 0 01-.375.375h.375zM14.25 6.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0zM9 9.875A4.125 4.125 0 004.875 14v1.125c0 .207.168.375.375.375h8.5a.375.375 0 00.375-.375V14A4.125 4.125 0 009 9.875zm11.25-1.5a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75zm-.375 1.5h-2.25a3 3 0 00-3 3v1.125c0 .207.168.375.375.375h6.75a.375.375 0 00.375-.375v-1.125a3 3 0 00-3-3h-.25z" />
            </svg>
            Teams Chat
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default PartnerCard;
