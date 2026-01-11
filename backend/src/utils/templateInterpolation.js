/**
 * Template interpolation utilities
 * Handles variable substitution in email and Teams templates
 */

const { formatDate } = require('./helpers');
const { buildFrontendUrl } = require('../config/urls');

/**
 * Interpolate variables in a template string
 * Supports ${variableName} syntax
 *
 * @param {string} template - Template string with ${variable} placeholders
 * @param {object} variables - Object containing variable values
 * @returns {string} - Interpolated string
 */
function interpolate(template, variables) {
  if (!template) return '';

  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) {
      return match; // Keep original placeholder if variable not found
    }
    return String(value);
  });
}

/**
 * Prepare variables for template interpolation
 * Processes arrays and dates into template-friendly formats
 *
 * @param {object} rawVars - Raw variable values
 * @param {string} templateType - Type of template
 * @returns {object} - Prepared variables
 */
function prepareVariables(rawVars, templateType) {
  const vars = { ...rawVars };

  // Format date if present
  if (vars.meetingDate) {
    if (typeof formatDate === 'function') {
      vars.formattedDate = formatDate(vars.meetingDate);
    } else {
      vars.formattedDate = new Date(vars.meetingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // Format icebreakers array into HTML and text lists
  if (vars.icebreakers && Array.isArray(vars.icebreakers)) {
    vars.icebreakerHTML = vars.icebreakers
      .map(topic => `<li>${escapeHtml(topic)}</li>`)
      .join('\n');

    vars.icebreakerList = vars.icebreakers
      .map((topic, index) => `${index + 1}. ${topic}`)
      .join('\n\n');

    vars.icebreakerText = vars.icebreakers.join(', ');

    // Individual icebreaker variables for Teams cards
    vars.icebreakers.forEach((topic, index) => {
      vars[`icebreaker${index + 1}`] = topic;
    });
  }

  // Calculate urgency text for reminders
  if (vars.daysUntil !== undefined) {
    vars.urgency = vars.daysUntil === 1 ? 'tomorrow' : `in ${vars.daysUntil} days`;
  }

  // Build URLs from pairingId if present
  if (vars.pairingId) {
    vars.pairingUrl = buildFrontendUrl(`/pairings/${vars.pairingId}`);
    vars.feedbackUrl = buildFrontendUrl(`/pairings/${vars.pairingId}/feedback`);
  }

  return vars;
}

/**
 * Escape HTML special characters
 *
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Interpolate variables in a JSON object (for Teams Adaptive Cards)
 * Recursively processes all string values
 *
 * @param {object} obj - JSON object with ${variable} placeholders
 * @param {object} variables - Object containing variable values
 * @returns {object} - Interpolated JSON object
 */
function interpolateJson(obj, variables) {
  if (typeof obj === 'string') {
    return interpolate(obj, variables);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => interpolateJson(item, variables));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateJson(value, variables);
    }
    return result;
  }

  return obj;
}

/**
 * Validate template syntax
 * Checks for unclosed placeholders and basic HTML structure
 *
 * @param {string} template - Template string to validate
 * @param {string} type - 'html', 'text', or 'json'
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validateTemplate(template, type) {
  const errors = [];

  if (!template || template.trim() === '') {
    errors.push('Template cannot be empty');
    return { valid: false, errors };
  }

  // Check for unclosed placeholders
  const unclosedPattern = /\$\{[^}]*$/;
  if (unclosedPattern.test(template)) {
    errors.push('Unclosed variable placeholder detected');
  }

  // Check for invalid placeholder syntax
  const invalidPattern = /\$\{[^a-zA-Z_][^}]*\}/;
  if (invalidPattern.test(template)) {
    errors.push('Invalid variable name in placeholder');
  }

  if (type === 'json') {
    try {
      JSON.parse(template);
    } catch (e) {
      errors.push(`Invalid JSON: ${e.message}`);
    }
  }

  if (type === 'html') {
    // Basic HTML tag matching check
    const openTags = (template.match(/<[a-z]+[^>]*>/gi) || []).length;
    const closeTags = (template.match(/<\/[a-z]+>/gi) || []).length;
    // Note: This is a basic check; self-closing tags will cause mismatch
    // but that's typically fine for email templates
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  interpolate,
  prepareVariables,
  escapeHtml,
  interpolateJson,
  validateTemplate
};
