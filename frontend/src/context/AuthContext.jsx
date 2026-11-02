import React, { createContext, useContext, useState, useEffect } from 'react';
import { djangoClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fleetflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fleetflow_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('fleetflow_access_token');
      if (savedToken) {
        try {
          const res = await djangoClient.get('/api/auth/me/');
          setUser(res.data);
          localStorage.setItem('fleetflow_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (username, password) => {
    const res = await djangoClient.post('/api/auth/login/', { username, password });
    const { access, refresh, user: userData } = res.data;
    localStorage.setItem('fleetflow_access_token', access);
    localStorage.setItem('fleetflow_refresh_token', refresh);
    localStorage.setItem('fleetflow_user', JSON.stringify(userData));
    setToken(access);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await djangoClient.post('/api/auth/register/', userData);
    const { access, refresh, user: newUser } = res.data;
    localStorage.setItem('fleetflow_access_token', access);
    localStorage.setItem('fleetflow_refresh_token', refresh);
    localStorage.setItem('fleetflow_user', JSON.stringify(newUser));
    setToken(access);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('fleetflow_refresh_token');
    if (refreshToken) {
      djangoClient.post('/api/auth/logout/', { refresh: refreshToken }).catch(() => {});
    }
    localStorage.removeItem('fleetflow_access_token');
    localStorage.removeItem('fleetflow_refresh_token');
    localStorage.removeItem('fleetflow_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('fleetflow_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
