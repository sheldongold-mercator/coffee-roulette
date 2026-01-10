import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msal';
import { authAPI } from '../services/api';

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
        console.log('🔐 AuthContext: Initializing auth...');

        // Check if we have an MSAL account (from successful Microsoft login)
        const accounts = instance.getAllAccounts();
        console.log('🔐 AuthContext: MSAL accounts:', accounts.length);

        if (accounts.length > 0) {
          // We have a Microsoft account, get a fresh token
          console.log('🔐 AuthContext: Found MSAL account:', accounts[0].username);

          try {
            const tokenResponse = await instance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            console.log('🔐 AuthContext: Got Microsoft token, exchanging for JWT...');

            // Exchange Microsoft token for our JWT
            const authResponse = await authAPI.login(tokenResponse.accessToken);
            console.log('🔐 AuthContext: JWT exchange successful');
            const { token, user: userData } = authResponse.data;

            // Store JWT
            localStorage.setItem('jwtToken', token);
            setUser(userData);
            console.log('🔐 AuthContext: User logged in:', userData.email);
          } catch (tokenError) {
            console.error('❌ AuthContext: Token acquisition failed:', tokenError);
            // If silent token acquisition fails, try interactive
            if (tokenError.name === 'InteractionRequiredAuthError') {
              console.log('🔐 AuthContext: Interaction required, redirecting...');
              await instance.loginRedirect(loginRequest);
            }
          }
        } else {
          // No Microsoft account, check if we have an existing JWT
          const jwtToken = localStorage.getItem('jwtToken');
          console.log('🔐 AuthContext: Checking for existing JWT:', jwtToken ? 'Found' : 'Not found');

          if (jwtToken) {
            // Verify token with backend
            console.log('🔐 AuthContext: Verifying JWT with backend...');
            const authResponse = await authAPI.getCurrentUser();
            setUser(authResponse.data);
            console.log('🔐 AuthContext: User authenticated:', authResponse.data.email);
          }
        }
      } catch (err) {
        console.error('❌ AuthContext: Auth initialization error:', err);
        console.error('❌ AuthContext: Error details:', err.response?.data || err.message);
        localStorage.removeItem('jwtToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [instance]);

  const login = async () => {
    try {
      console.log('🔐 Login function called');
      setLoading(true);
      setError(null);

      console.log('🔐 Starting Microsoft redirect...');
      console.log('🔐 Login request scopes:', loginRequest);

      // Redirect to Microsoft login
      // After successful login, user will be redirected back to this app
      // and the useEffect above will handle the token exchange
      await instance.loginRedirect(loginRequest);

      console.log('🔐 Redirect initiated (this may not show if redirect is immediate)');
      return { success: true };
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('❌ Error details:', err);
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
      console.error('Logout error:', err);
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
