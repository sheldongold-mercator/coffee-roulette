/**
 * Centralized URL configuration for Coffee Roulette
 *
 * This module provides consistent URL handling across the application.
 * URLs are read from environment variables with sensible production defaults.
 *
 * In development: Set FRONTEND_URL and BACKEND_URL in .env to override
 * In production: These should always be set in .env, but defaults are provided as fallback
 */

// Production default URL (used if env var is not set)
const PRODUCTION_URL = 'https://ec2-100-52-223-104.compute-1.amazonaws.com';

/**
 * Get the frontend URL for use in emails and notifications
 * This is where users will be directed when clicking links
 */
const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || PRODUCTION_URL;
};

/**
 * Get the backend/API URL for use in opt-out links and API callbacks
 * In most deployments, this is the same as the frontend URL (nginx proxies /api)
 */
const getBackendUrl = () => {
  return process.env.BACKEND_URL || PRODUCTION_URL;
};

/**
 * Build a frontend URL path
 * @param {string} path - The path to append (e.g., '/pairings/123')
 * @returns {string} Full URL
 */
const buildFrontendUrl = (path) => {
  const baseUrl = getFrontendUrl().replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Build a backend API URL path
 * @param {string} path - The path to append (e.g., '/api/public/opt-out/token')
 * @returns {string} Full URL
 */
const buildBackendUrl = (path) => {
  const baseUrl = getBackendUrl().replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get CORS origin for the application
 * In development, allows localhost; in production, uses the frontend URL
 */
const getCorsOrigin = () => {
  if (process.env.NODE_ENV !== 'production') {
    // In development, allow both localhost variants
    return process.env.FRONTEND_URL || 'http://localhost:3001';
  }
  return getFrontendUrl();
};

module.exports = {
  getFrontendUrl,
  getBackendUrl,
  buildFrontendUrl,
  buildBackendUrl,
  getCorsOrigin,
  PRODUCTION_URL
};
