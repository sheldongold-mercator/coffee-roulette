import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { templateAPI } from '../services/api';
import TemplateEditor from '../components/templates/TemplateEditor';

const channelIcons = {
  email: EnvelopeIcon,
  teams: ChatBubbleLeftRightIcon,
};

const Templates = () => {
  const queryClient = useQueryClient();
  const [activeChannel, setActiveChannel] = useState('email');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Fetch all templates
  const { data: templatesData, isLoading } = useQuery(
    ['templates'],
    () => templateAPI.getTemplates()
  );

  // Filter templates by channel
  const templates = templatesData?.data?.data || [];
  const filteredTemplates = templates.filter(t => t.channel === activeChannel);

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedTemplate(null);
    queryClient.invalidateQueries('templates');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Email & Notification Templates</h1>
        <p className="mt-2 text-gray-600">
          Customize the email and Teams notification templates sent to users
        </p>
      </motion.div>

      {/* Channel Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveChannel('email')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeChannel === 'email'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <EnvelopeIcon className="w-5 h-5" />
            Email Templates
          </button>
          <button
            onClick={() => setActiveChannel('teams')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeChannel === 'teams'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Teams Cards
          </button>
        </nav>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredTemplates.map((template, index) => {
            const ChannelIcon = channelIcons[template.channel];
            return (
              <motion.div
                key={`${template.templateType}-${template.channel}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      template.channel === 'email'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      <ChannelIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.isCustomized ? (
                      <span className="badge badge-info">Customized</span>
                    ) : (
                      <span className="badge badge-success">Default</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {template.isCustomized && template.lastUpdated ? (
                        <>
                          Last updated: {new Date(template.lastUpdated).toLocaleDateString()}
                          {template.updatedBy && (
                            <span> by {template.updatedBy.name}</span>
                          )}
                        </>
                      ) : (
                        <span>Using default template</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="btn btn-secondary btn-sm flex items-center gap-2"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Variables preview */}
                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
                    Available Variables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(template.variables || []).slice(0, 5).map((v) => (
                      <code
                        key={v.name}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        ${'{'}
                        {v.name}
                        {'}'}
                      </code>
                    ))}
                    {template.variables?.length > 5 && (
                      <span className="text-xs text-gray-400">
                        +{template.variables.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && selectedTemplate && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
};

export default Templates;
