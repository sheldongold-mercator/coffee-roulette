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
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const jwtToken = localStorage.getItem('jwtToken');
        if (jwtToken) {
          // Verify token with backend
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('jwtToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Microsoft token
      const response = await instance.loginPopup(loginRequest);
      const microsoftToken = response.accessToken;

      // Exchange for JWT
      const authResponse = await authAPI.login(microsoftToken);
      const { token, user: userData } = authResponse.data;

      // Store JWT
      localStorage.setItem('jwtToken', token);
      setUser(userData);

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Clear local storage
      localStorage.removeItem('jwtToken');
      setUser(null);

      // Logout from Microsoft
      await instance.logoutPopup();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
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
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
