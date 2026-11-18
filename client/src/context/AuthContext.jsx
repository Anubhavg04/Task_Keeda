import React, { useReducer, useEffect, useCallback } from 'react';
import {
  authAPI,
  cacheUserSession,
  clearCachedUserSession,
  getCachedUserSession,
  userAPI,
} from '../services/api.js';
import { AuthContext } from './authContextValue.js';

let sessionCheckPromise = null;

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, loading: false, user: action.payload, isAuthenticated: true };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case 'REGISTER_START':
      return { ...state, loading: true, error: null };
    case 'REGISTER_SUCCESS':
      return { ...state, loading: false };
    case 'REGISTER_FAILURE':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.login({ email, password });
      cacheUserSession(response.data.user);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (fullname, email, password) => {
    try {
      dispatch({ type: 'REGISTER_START' });
      const response = await authAPI.register({ fullname, email, password });
      dispatch({ type: 'REGISTER_SUCCESS' });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      clearCachedUserSession();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const checkAuth = useCallback(async () => {
    const cachedUser = getCachedUserSession();
    if (cachedUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: cachedUser });
      return;
    }

    if (sessionCheckPromise) return sessionCheckPromise;
    sessionCheckPromise = (async () => {
      try {
        const response = await userAPI.getUser();
        if (response.data.user) {
          cacheUserSession(response.data.user);
          dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
        } else {
          clearCachedUserSession();
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Session check failed:', error);
        }
        clearCachedUserSession();
        dispatch({ type: 'LOGOUT' });
      } finally {
        sessionCheckPromise = null;
      }
    })();
    return sessionCheckPromise;
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleUnauthorized = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('taskflow:auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('taskflow:auth-unauthorized', handleUnauthorized);
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
