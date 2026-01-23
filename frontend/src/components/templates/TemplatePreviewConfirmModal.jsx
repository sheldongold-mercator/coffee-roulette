import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { templateAPI } from '../../services/api';

/**
 * TemplatePreviewConfirmModal
 *
 * Shows a preview of the email/Teams template that will be sent,
 * with options to view, edit templates, or confirm the action.
 */
const TemplatePreviewConfirmModal = ({
  templateType,
  channel = 'email',
  customData = {},
  actionDescription,
  affectedCount,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmButtonText = 'Confirm & Send',
  title = 'Notification Preview',
}) => {
  const [viewMode, setViewMode] = useState('desktop');
  const [activeChannel, setActiveChannel] = useState(channel);
  const iframeRef = useRef(null);
  const teamsCardRef = useRef(null);

  // Fetch template preview
  const { data: previewData, isLoading: previewLoading, error: previewError } = useQuery(
    ['template-preview', templateType, activeChannel],
    () => templateAPI.previewTemplate(templateType, activeChannel, customData),
    {
      enabled: !!templateType,
      staleTime: 30000,
    }
  );

  const preview = previewData?.data;

  // Render Teams Adaptive Card using Microsoft's adaptivecards library
  // The library handles sanitization internally for Adaptive Card content
  useEffect(() => {
    if (activeChannel === 'teams' && preview?.card && teamsCardRef.current) {
      import('adaptivecards').then((AdaptiveCards) => {
        const adaptiveCard = new AdaptiveCards.AdaptiveCard();
        adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
          fontFamily: 'Segoe UI, Helvetica Neue, sans-serif',
          containerStyles: {
            default: {
              backgroundColor: '#FFFFFF',
            },
          },
        });

        try {
          let cardContent = preview.card;
          if (preview.card.attachments && preview.card.attachments[0]) {
            cardContent = preview.card.attachments[0].content;
          }

          adaptiveCard.parse(cardContent);
          // Clear container and append rendered card from adaptivecards library
          while (teamsCardRef.current.firstChild) {
            teamsCardRef.current.removeChild(teamsCardRef.current.firstChild);
          }
          const renderedCard = adaptiveCard.render();
          if (renderedCard) {
            teamsCardRef.current.appendChild(renderedCard);
          }
        } catch (error) {
          console.error('Error rendering adaptive card:', error);
          // Use textContent for error messages to avoid XSS
          while (teamsCardRef.current.firstChild) {
            teamsCardRef.current.removeChild(teamsCardRef.current.firstChild);
          }
          const errorDiv = document.createElement('div');
          errorDiv.className = 'text-red-500 p-4';
          errorDiv.textContent = `Error rendering card: ${error.message}`;
          teamsCardRef.current.appendChild(errorDiv);
        }
      }).catch((error) => {
        console.error('Error loading adaptivecards:', error);
      });
    }
  }, [activeChannel, preview]);

  const templateTypeLabels = {
    welcome: 'Welcome Email',
    pairing_notification: 'Pairing Notification',
    meeting_reminder: 'Meeting Reminder',
    feedback_request: 'Feedback Request',
  };

  const handleEditTemplate = () => {
    // Open template editor in new tab
    window.open(`/admin/templates?type=${templateType}&channel=${activeChannel}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onCancel}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {templateTypeLabels[templateType] || templateType}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Action Description */}
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {actionDescription}
                </p>
                {affectedCount !== undefined && (
                  <p className="text-sm text-amber-700 mt-1">
                    This action will affect <strong>{affectedCount}</strong> {affectedCount === 1 ? 'user' : 'users'}.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Channel Tabs & View Mode Toggle */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChannel('email')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeChannel === 'email'
                    ? 'bg-white shadow-sm text-primary-600 border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <EnvelopeIcon className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => setActiveChannel('teams')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeChannel === 'teams'
                    ? 'bg-white shadow-sm text-primary-600 border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Teams
              </button>
            </div>

            {activeChannel === 'email' && (
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'desktop'
                      ? 'bg-gray-100 text-primary-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Desktop view"
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'mobile'
                      ? 'bg-gray-100 text-primary-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Mobile view"
                >
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4" style={{ maxHeight: '400px' }}>
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : previewError ? (
              <div className="text-center py-12 text-red-500">
                <p>Failed to load template preview</p>
                <p className="text-sm mt-1">{previewError.message}</p>
              </div>
            ) : preview ? (
              activeChannel === 'email' ? (
                <div className="space-y-3">
                  {/* Subject */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <span className="text-xs font-medium text-gray-500 uppercase">Subject:</span>
                    <p className="text-gray-900 mt-1">{preview.subject}</p>
                  </div>

                  {/* HTML Preview */}
                  <div
                    className={`bg-white rounded-lg shadow-sm overflow-hidden mx-auto transition-all ${
                      viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
                    }`}
                  >
                    <div className="border-b border-gray-200 px-3 py-2 bg-gray-50">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {viewMode === 'mobile' ? 'Mobile Preview' : 'Email Preview'}
                      </span>
                    </div>
                    <iframe
                      ref={iframeRef}
                      srcDoc={preview.html}
                      title="Email Preview"
                      className="w-full"
                      style={{
                        height: '350px',
                        border: 'none',
                      }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              ) : (
                /* Teams Card Preview */
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-3 py-2 bg-gray-50">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Teams Adaptive Card
                      </span>
                    </div>
                    <div
                      ref={teamsCardRef}
                      className="p-4"
                      style={{ minHeight: '150px' }}
                    >
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <EyeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No preview available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
            <button
              onClick={handleEditTemplate}
              className="btn btn-secondary flex items-center gap-2"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Edit Template
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading || previewLoading}
                className="btn btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : confirmButtonText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TemplatePreviewConfirmModal;
