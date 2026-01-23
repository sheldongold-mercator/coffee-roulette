import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

const TemplatePreview = ({ channel, data, onClose }) => {
  const [viewMode, setViewMode] = useState('desktop');
  const iframeRef = useRef(null);
  const teamsCardRef = useRef(null);

  // Render Teams Adaptive Card
  useEffect(() => {
    if (channel === 'teams' && data?.card && teamsCardRef.current) {
      // Dynamically load adaptivecards
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
          // Handle Teams card structure
          let cardContent = data.card;
          if (data.card.attachments && data.card.attachments[0]) {
            cardContent = data.card.attachments[0].content;
          }

          adaptiveCard.parse(cardContent);
          // Clear container safely (no innerHTML)
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
  }, [channel, data]);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Template Preview
            </h2>
            <div className="flex items-center gap-4">
              {channel === 'email' && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'desktop'
                        ? 'bg-white shadow-sm text-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Desktop view"
                  >
                    <ComputerDesktopIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'mobile'
                        ? 'bg-white shadow-sm text-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Mobile view"
                  >
                    <DevicePhoneMobileIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            {channel === 'email' ? (
              <div className="space-y-4">
                {/* Subject */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="text-sm font-medium text-gray-500">Subject:</span>
                  <p className="text-gray-900 mt-1">{data.subject}</p>
                </div>

                {/* HTML Preview */}
                <div
                  className={`bg-white rounded-lg shadow-sm overflow-hidden mx-auto transition-all ${
                    viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
                  }`}
                >
                  <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      HTML Preview {viewMode === 'mobile' && '(Mobile)'}
                    </span>
                  </div>
                  <iframe
                    ref={iframeRef}
                    srcDoc={data.html}
                    title="Email Preview"
                    className="w-full"
                    style={{
                      height: '500px',
                      border: 'none',
                    }}
                    sandbox=""
                  />
                </div>

                {/* Plain Text Preview */}
                {data.text && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Plain Text Version
                      </span>
                    </div>
                    <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                      {data.text}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* Teams Card Preview */
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Teams Adaptive Card
                    </span>
                  </div>
                  <div
                    ref={teamsCardRef}
                    className="p-4"
                    style={{ minHeight: '200px' }}
                  >
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Raw JSON */}
                {data.cardJson && (
                  <div className="mt-4 bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        JSON Output
                      </span>
                    </div>
                    <pre className="p-4 text-xs text-gray-700 overflow-x-auto font-mono bg-gray-900 text-green-400">
                      {data.cardJson}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TemplatePreview;
