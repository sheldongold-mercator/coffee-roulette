import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  XMarkIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { templateAPI } from '../../services/api';
import toast from 'react-hot-toast';
import TemplatePreview from './TemplatePreview';

const TemplateEditor = ({ template, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(template.channel === 'teams' ? 'json' : 'html');
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(true);
  const [previewData, setPreviewData] = useState(null);

  // Editor refs for cursor position insertion
  const htmlEditorRef = useRef(null);
  const textEditorRef = useRef(null);
  const jsonEditorRef = useRef(null);

  // Content state
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch full template content
  const { data: templateData, isLoading } = useQuery(
    ['template', template.templateType, template.channel],
    () => templateAPI.getTemplate(template.templateType, template.channel),
    {
      onSuccess: (data) => {
        const content = data?.data?.data?.content || {};
        setSubject(content.subject || '');
        setHtmlContent(content.html_content || '');
        setTextContent(content.text_content || '');
        setJsonContent(content.json_content || '');
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (data) => templateAPI.updateTemplate(template.templateType, template.channel, data),
    {
      onSuccess: async () => {
        // Invalidate and refetch both the templates list and this specific template
        await queryClient.invalidateQueries('templates');
        await queryClient.invalidateQueries(['template', template.templateType, template.channel]);
        // Force refetch to ensure UI updates
        await queryClient.refetchQueries(['template', template.templateType, template.channel]);
        toast.success('Template saved successfully!');
        setHasChanges(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save template');
      }
    }
  );

  // Preview mutation
  const previewMutation = useMutation(
    (data) => templateAPI.previewTemplate(template.templateType, template.channel, data),
    {
      onSuccess: (data) => {
        setPreviewData(data?.data?.data);
        setShowPreview(true);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate preview');
      }
    }
  );

  // Restore mutation
  const restoreMutation = useMutation(
    () => templateAPI.restoreDefault(template.templateType, template.channel),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('templates');
        queryClient.invalidateQueries(['template', template.templateType, template.channel]);
        toast.success('Template restored to default');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to restore template');
      }
    }
  );

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [subject, htmlContent, textContent, jsonContent]);

  const handleSave = () => {
    if (template.channel === 'email') {
      updateMutation.mutate({
        subject,
        htmlContent,
        textContent
      });
    } else {
      updateMutation.mutate({
        jsonContent
      });
    }
  };

  const handlePreview = () => {
    if (template.channel === 'email') {
      previewMutation.mutate({
        subject,
        htmlContent,
        textContent
      });
    } else {
      previewMutation.mutate({
        jsonContent
      });
    }
  };

  const handleRestore = () => {
    if (window.confirm('Are you sure you want to restore this template to the default? Your customizations will be lost.')) {
      restoreMutation.mutate();
    }
  };

  const variables = templateData?.data?.data?.variables || template.variables || [];

  // Get the current editor based on active tab
  const getCurrentEditor = () => {
    if (activeTab === 'html') return htmlEditorRef.current;
    if (activeTab === 'text') return textEditorRef.current;
    if (activeTab === 'json') return jsonEditorRef.current;
    return null;
  };

  const insertVariable = (varName) => {
    const insertion = `\${${varName}}`;
    const editor = getCurrentEditor();

    if (editor) {
      // Get the current selection or cursor position
      const selection = editor.getSelection();

      // Create an edit operation to insert/replace at cursor
      const op = {
        range: selection,
        text: insertion,
        forceMoveMarkers: true
      };

      // Execute the edit
      editor.executeEdits('variable-insert', [op]);

      // Focus the editor after insertion
      editor.focus();

      toast.success(`Inserted ${insertion}`);
    } else {
      // Fallback: append to content if editor not available
      if (activeTab === 'html') {
        setHtmlContent(prev => prev + insertion);
      } else if (activeTab === 'text') {
        setTextContent(prev => prev + insertion);
      } else if (activeTab === 'json') {
        setJsonContent(prev => prev + insertion);
      }
      toast.success(`Inserted ${insertion} at end`);
    }
  };

  // Editor mount handlers to capture editor instances
  const handleHtmlEditorMount = (editor) => {
    htmlEditorRef.current = editor;
  };

  const handleTextEditorMount = (editor) => {
    textEditorRef.current = editor;
  };

  const handleJsonEditorMount = (editor) => {
    jsonEditorRef.current = editor;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
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
          className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Edit {template.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {template.channel === 'email' ? 'Email Template' : 'Teams Adaptive Card'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                disabled={previewMutation.isLoading}
                className="btn btn-secondary flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </button>
              {templateData?.data?.data?.isCustomized && (
                <button
                  onClick={handleRestore}
                  disabled={restoreMutation.isLoading}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Restore Default
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={updateMutation.isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Editor Panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  {/* Subject input for emails */}
                  {template.channel === 'email' && (
                    <div className="px-6 py-4 border-b border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="input"
                        placeholder="Enter email subject..."
                      />
                    </div>
                  )}

                  {/* Editor Tabs */}
                  {template.channel === 'email' && (
                    <div className="px-6 pt-4 border-b border-gray-200">
                      <nav className="-mb-px flex gap-4">
                        <button
                          onClick={() => setActiveTab('html')}
                          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                            activeTab === 'html'
                              ? 'border-primary-600 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <CodeBracketIcon className="w-4 h-4" />
                          HTML
                        </button>
                        <button
                          onClick={() => setActiveTab('text')}
                          className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                            activeTab === 'text'
                              ? 'border-primary-600 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          Plain Text
                        </button>
                      </nav>
                    </div>
                  )}

                  {/* Monaco Editor */}
                  <div className="flex-1 min-h-0">
                    {template.channel === 'email' ? (
                      activeTab === 'html' ? (
                        <Editor
                          height="100%"
                          language="html"
                          theme="vs-dark"
                          value={htmlContent}
                          onChange={(value) => setHtmlContent(value || '')}
                          onMount={handleHtmlEditorMount}
                          options={{
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                          }}
                        />
                      ) : (
                        <Editor
                          height="100%"
                          language="plaintext"
                          theme="vs-dark"
                          value={textContent}
                          onChange={(value) => setTextContent(value || '')}
                          onMount={handleTextEditorMount}
                          options={{
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                          }}
                        />
                      )
                    ) : (
                      <Editor
                        height="100%"
                        language="json"
                        theme="vs-dark"
                        value={jsonContent}
                        onChange={(value) => setJsonContent(value || '')}
                        onMount={handleJsonEditorMount}
                        options={{
                          minimap: { enabled: false },
                          wordWrap: 'on',
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          formatOnPaste: true,
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Variables Panel */}
            <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="flex items-center gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                  Available Variables
                </span>
                {showVariables ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>

              {showVariables && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-gray-500">
                    Click a variable to insert it at your cursor position (or replace selected text)
                  </p>
                  {variables.map((v) => (
                    <div
                      key={v.name}
                      className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
                      onClick={() => insertVariable(v.name)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono text-primary-600">
                          ${'{'}
                          {v.name}
                          {'}'}
                        </code>
                        {v.required && (
                          <span className="text-xs text-red-500">Required</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{v.description}</p>
                      {v.example && (
                        <p className="text-xs text-gray-400 mt-1">
                          Example: <span className="italic">{v.example}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <TemplatePreview
          channel={template.channel}
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default TemplateEditor;
