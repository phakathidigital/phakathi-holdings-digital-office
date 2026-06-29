import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({
    id: 'phakathi-flow-local',
    public_settings: { auth_required: true, backend: 'self-hosted-local' },
  });

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status && error.status !== 401) {
        setAuthError({ type: 'api_error', message: error.message });
      }
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const loginOrRegister = async (credentials) => {
    setIsLoadingAuth(true);
    const currentUser = await api.auth.loginOrRegister(credentials);
    setUser(currentUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    return currentUser;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    api.auth.logout();
  };

  const navigateToLogin = (credentials) => loginOrRegister(credentials);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      loginOrRegister,
      checkAppState: checkUserAuth,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
