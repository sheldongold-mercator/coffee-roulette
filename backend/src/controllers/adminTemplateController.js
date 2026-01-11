const { NotificationTemplate, User } = require('../models');
const logger = require('../utils/logger');
const sampleData = require('../templates/sampleData');
const { variableDefinitions, templateMetadata } = sampleData;
const { interpolate, prepareVariables, interpolateJson, validateTemplate } = require('../utils/templateInterpolation');
const path = require('path');
const fs = require('fs');

// Map template types to file names
const templateTypeToFile = {
  welcome: 'welcome',
  pairing_notification: 'pairing_notification',
  meeting_reminder: 'meeting_reminder',
  feedback_request: 'feedback_request'
};

/**
 * Get default template content from file
 * Returns raw template source with ${variable} placeholders for editor display
 */
const getDefaultTemplate = (type, channel) => {
  try {
    if (channel === 'email') {
      const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateTypeToFile[type]}.js`);

      // Clear require cache to get fresh module
      delete require.cache[require.resolve(templatePath)];
      const templateModule = require(templatePath);

      // Check if template exports rawTemplates (preferred for editor display)
      if (templateModule.rawTemplates) {
        return {
          subject: templateModule.rawTemplates.subject || '',
          html_content: templateModule.rawTemplates.html || '',
          text_content: templateModule.rawTemplates.text || ''
        };
      }

      // Fallback: execute template function with sample data (legacy behavior)
      const sample = sampleData[type] || {};
      const prepared = prepareVariables(sample, type);
      const result = templateModule(prepared);

      return {
        subject: result.subject || '',
        html_content: result.html || '',
        text_content: result.text || ''
      };
    } else if (channel === 'teams') {
      const teamsService = require('../services/teamsService');

      // Check if teamsService exports rawTemplates (preferred for editor display)
      if (teamsService.rawTemplates && teamsService.rawTemplates[type]) {
        return {
          json_content: JSON.stringify(teamsService.rawTemplates[type], null, 2)
        };
      }

      // Fallback: execute card creator with sample data (legacy behavior)
      let cardContent = '';
      try {
        const sample = sampleData[type] || {};
        const prepared = prepareVariables(sample, type);

        if (type === 'pairing_notification') {
          const card = teamsService.createPairingCard(prepared);
          cardContent = JSON.stringify(card, null, 2);
        } else if (type === 'meeting_reminder') {
          const card = teamsService.createReminderCard(prepared);
          cardContent = JSON.stringify(card, null, 2);
        } else if (type === 'feedback_request') {
          const card = teamsService.createFeedbackCard(prepared);
          cardContent = JSON.stringify(card, null, 2);
        }
      } catch (e) {
        logger.warn(`Could not generate Teams card for ${type}:`, e.message);
        cardContent = JSON.stringify({ type: 'AdaptiveCard', body: [] }, null, 2);
      }

      return {
        json_content: cardContent
      };
    }
  } catch (error) {
    logger.error(`Error loading default template ${type}/${channel}:`, error);
    return null;
  }
};

/**
 * Get all templates (with default fallback info)
 */
const getTemplates = async (req, res) => {
  try {
    // Get all DB templates
    const dbTemplates = await NotificationTemplate.findAll({
      include: [{
        association: 'updatedByUser',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }],
      order: [['template_type', 'ASC'], ['channel', 'ASC']]
    });

    // Build response with metadata
    const templates = [];

    for (const [type, meta] of Object.entries(templateMetadata)) {
      for (const channel of meta.channels) {
        const dbTemplate = dbTemplates.find(
          t => t.template_type === type && t.channel === channel
        );

        templates.push({
          templateType: type,
          channel,
          name: meta.name,
          description: meta.description,
          isCustomized: dbTemplate?.is_active || false,
          lastUpdated: dbTemplate?.updated_at || null,
          updatedBy: dbTemplate?.updatedByUser ? {
            id: dbTemplate.updatedByUser.id,
            name: `${dbTemplate.updatedByUser.first_name} ${dbTemplate.updatedByUser.last_name}`,
            email: dbTemplate.updatedByUser.email
          } : null,
          variables: variableDefinitions[type] || []
        });
      }
    }

    res.json({ data: templates });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch templates'
    });
  }
};

/**
 * Get specific template content
 */
const getTemplate = async (req, res) => {
  try {
    const { type, channel } = req.params;

    // Validate type and channel
    if (!templateMetadata[type]) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid template type'
      });
    }

    if (!['email', 'teams'].includes(channel)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid channel'
      });
    }

    // Check if this template type supports this channel
    if (!templateMetadata[type].channels.includes(channel)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Template type "${type}" does not support channel "${channel}"`
      });
    }

    // Check for custom template in DB
    const dbTemplate = await NotificationTemplate.findOne({
      where: { template_type: type, channel },
      include: [{
        association: 'updatedByUser',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    // Get default template content
    const defaultContent = getDefaultTemplate(type, channel);

    // Determine what content to return
    let content;
    let isCustomized = false;

    if (dbTemplate && dbTemplate.is_active) {
      isCustomized = true;
      content = {
        subject: dbTemplate.subject,
        html_content: dbTemplate.html_content,
        text_content: dbTemplate.text_content,
        json_content: dbTemplate.json_content
      };
    } else {
      content = defaultContent || {};
    }

    res.json({
      data: {
        templateType: type,
        channel,
        name: templateMetadata[type].name,
        description: templateMetadata[type].description,
        isCustomized,
        content,
        defaultContent,
        variables: variableDefinitions[type] || [],
        lastUpdated: dbTemplate?.updated_at || null,
        updatedBy: dbTemplate?.updatedByUser ? {
          id: dbTemplate.updatedByUser.id,
          name: `${dbTemplate.updatedByUser.first_name} ${dbTemplate.updatedByUser.last_name}`
        } : null
      }
    });
  } catch (error) {
    logger.error('Get template error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch template'
    });
  }
};

/**
 * Update template content
 */
const updateTemplate = async (req, res) => {
  try {
    const { type, channel } = req.params;
    const { subject, htmlContent, textContent, jsonContent } = req.body;

    // Validate type and channel
    if (!templateMetadata[type]) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid template type'
      });
    }

    if (!['email', 'teams'].includes(channel)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid channel'
      });
    }

    // Validate content based on channel
    if (channel === 'email') {
      if (!htmlContent && !textContent) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email templates require HTML or text content'
        });
      }

      // Validate HTML
      if (htmlContent) {
        const htmlValidation = validateTemplate(htmlContent, 'html');
        if (!htmlValidation.valid) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid HTML content',
            details: htmlValidation.errors
          });
        }
      }
    } else if (channel === 'teams') {
      if (!jsonContent) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Teams templates require JSON content'
        });
      }

      // Validate JSON
      const jsonValidation = validateTemplate(jsonContent, 'json');
      if (!jsonValidation.valid) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid JSON content',
          details: jsonValidation.errors
        });
      }
    }

    // Find or create template record
    let [template, created] = await NotificationTemplate.findOrCreate({
      where: { template_type: type, channel },
      defaults: {
        template_type: type,
        channel,
        name: templateMetadata[type].name,
        description: templateMetadata[type].description,
        subject: channel === 'email' ? subject : null,
        html_content: channel === 'email' ? htmlContent : null,
        text_content: channel === 'email' ? textContent : null,
        json_content: channel === 'teams' ? jsonContent : null,
        variables: variableDefinitions[type] || [],
        is_active: true,
        updated_by: req.user.id
      }
    });

    if (!created) {
      // Update existing template
      await template.update({
        subject: channel === 'email' ? subject : null,
        html_content: channel === 'email' ? htmlContent : null,
        text_content: channel === 'email' ? textContent : null,
        json_content: channel === 'teams' ? jsonContent : null,
        is_active: true,
        updated_by: req.user.id
      });
    }

    logger.info(`Admin ${req.user.id} updated template ${type}/${channel}`);

    res.json({
      message: 'Template updated successfully',
      data: {
        templateType: type,
        channel,
        isCustomized: true,
        lastUpdated: template.updated_at
      }
    });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update template'
    });
  }
};

/**
 * Preview template with sample data
 */
const previewTemplate = async (req, res) => {
  try {
    const { type, channel } = req.params;
    const { subject, htmlContent, textContent, jsonContent, customData } = req.body;

    // Validate type
    if (!templateMetadata[type]) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid template type'
      });
    }

    // Get sample data and merge with any custom overrides
    const sample = sampleData[type] || {};
    const mergedData = { ...sample, ...(customData || {}) };
    const prepared = prepareVariables(mergedData, type);

    if (channel === 'email') {
      // If content provided in request, use it; otherwise get from DB/default
      let templateSubject = subject;
      let templateHtml = htmlContent;
      let templateText = textContent;

      if (!templateSubject && !templateHtml && !templateText) {
        // Get from DB or default
        const dbTemplate = await NotificationTemplate.findOne({
          where: { template_type: type, channel, is_active: true }
        });

        if (dbTemplate) {
          templateSubject = dbTemplate.subject;
          templateHtml = dbTemplate.html_content;
          templateText = dbTemplate.text_content;
        } else {
          const defaultContent = getDefaultTemplate(type, channel);
          templateSubject = defaultContent?.subject;
          templateHtml = defaultContent?.html_content;
          templateText = defaultContent?.text_content;
        }
      }

      res.json({
        data: {
          subject: interpolate(templateSubject || '', prepared),
          html: interpolate(templateHtml || '', prepared),
          text: interpolate(templateText || '', prepared),
          sampleData: prepared
        }
      });
    } else if (channel === 'teams') {
      let templateJson = jsonContent;

      if (!templateJson) {
        const dbTemplate = await NotificationTemplate.findOne({
          where: { template_type: type, channel, is_active: true }
        });

        if (dbTemplate) {
          templateJson = dbTemplate.json_content;
        } else {
          const defaultContent = getDefaultTemplate(type, channel);
          templateJson = defaultContent?.json_content;
        }
      }

      try {
        const cardObj = JSON.parse(templateJson || '{}');
        const interpolatedCard = interpolateJson(cardObj, prepared);

        res.json({
          data: {
            card: interpolatedCard,
            cardJson: JSON.stringify(interpolatedCard, null, 2),
            sampleData: prepared
          }
        });
      } catch (e) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid JSON in template'
        });
      }
    } else {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid channel'
      });
    }
  } catch (error) {
    logger.error('Preview template error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to preview template'
    });
  }
};

/**
 * Restore template to default
 */
const restoreDefault = async (req, res) => {
  try {
    const { type, channel } = req.params;

    // Validate type and channel
    if (!templateMetadata[type]) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid template type'
      });
    }

    const template = await NotificationTemplate.findOne({
      where: { template_type: type, channel }
    });

    if (template) {
      await template.update({
        is_active: false,
        updated_by: req.user.id
      });

      logger.info(`Admin ${req.user.id} restored template ${type}/${channel} to default`);
    }

    res.json({
      message: 'Template restored to default',
      data: {
        templateType: type,
        channel,
        isCustomized: false
      }
    });
  } catch (error) {
    logger.error('Restore template error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to restore template'
    });
  }
};

/**
 * Get variables for a template type
 */
const getVariables = async (req, res) => {
  try {
    const { type } = req.params;

    if (!variableDefinitions[type]) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Template type not found'
      });
    }

    res.json({
      data: {
        templateType: type,
        variables: variableDefinitions[type],
        sampleData: sampleData[type] || {}
      }
    });
  } catch (error) {
    logger.error('Get variables error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch variables'
    });
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  updateTemplate,
  previewTemplate,
  restoreDefault,
  getVariables
};
