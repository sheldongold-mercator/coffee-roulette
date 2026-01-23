import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msal';
import { authAPI } from '../services/api';
import logger from '../utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { instance } = useMsal();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        logger.log('AuthContext: Initializing auth...');

        // Check if we have an MSAL account (from successful Microsoft login)
        const accounts = instance.getAllAccounts();
        logger.log('AuthContext: MSAL accounts:', accounts.length);

        if (accounts.length > 0) {
          // We have a Microsoft account, get a fresh token
          logger.log('AuthContext: Found MSAL account');

          try {
            const tokenResponse = await instance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            logger.log('AuthContext: Got Microsoft token, exchanging for JWT...');

            // Exchange Microsoft token for our JWT
            const authResponse = await authAPI.login(tokenResponse.accessToken);
            logger.log('AuthContext: JWT exchange successful');
            const { token, user: userData } = authResponse.data;

            // Store JWT
            localStorage.setItem('jwtToken', token);
            setUser(userData);
            logger.log('AuthContext: User logged in');
          } catch (tokenError) {
            logger.error('AuthContext: Token acquisition failed:', tokenError.name);
            // If silent token acquisition fails, try interactive
            if (tokenError.name === 'InteractionRequiredAuthError') {
              logger.log('AuthContext: Interaction required, redirecting...');
              await instance.loginRedirect(loginRequest);
            }
          }
        } else {
          // No Microsoft account, check if we have an existing JWT
          const jwtToken = localStorage.getItem('jwtToken');
          logger.log('AuthContext: Checking for existing JWT:', jwtToken ? 'Found' : 'Not found');

          if (jwtToken) {
            // Verify token with backend
            logger.log('AuthContext: Verifying JWT with backend...');
            const authResponse = await authAPI.getCurrentUser();
            setUser(authResponse.data);
            logger.log('AuthContext: User authenticated');
          }
        }
      } catch (err) {
        logger.error('AuthContext: Auth initialization error:', err.name || 'Unknown');
        localStorage.removeItem('jwtToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [instance]);

  const login = async () => {
    try {
      logger.log('Login function called');
      setLoading(true);
      setError(null);

      logger.log('Starting Microsoft redirect...');

      // Redirect to Microsoft login
      // After successful login, user will be redirected back to this app
      // and the useEffect above will handle the token exchange
      await instance.loginRedirect(loginRequest);

      logger.log('Redirect initiated');
      return { success: true };
    } catch (err) {
      logger.error('Login error:', err.name || 'Unknown');
      setError(err.message || 'Failed to login');
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Clear local storage
      localStorage.removeItem('jwtToken');
      setUser(null);

      // Logout from Microsoft
      await instance.logoutRedirect();
    } catch (err) {
      logger.error('Logout error:', err.name || 'Unknown');
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || !!user?.adminRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
