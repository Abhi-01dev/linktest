import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        api.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data.user;
  };

  const register = async (fullName, email, password) => {
    const data = await api.register(fullName, email, password);
    // User is unverified, do not set user session yet
    return data;
  };

  const verifyEmail = async (email, otp) => {
    const data = await api.verifyEmail(email, otp);
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async (credential) => {
    const data = await api.loginWithGoogle(credential);
    setUser(data.user);
    return data;
  };

  const unlinkGoogle = async (password = '') => {
    const data = await api.unlinkGoogle(password);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const normalizedUser = user ? {
    ...user,
    role: String(user.role || '').toUpperCase()
  } : null;

  const value = {
    user: normalizedUser,
    loading,
    isAuthenticated: !!normalizedUser,
    isAdmin: normalizedUser?.role === 'ADMIN',
    isTeacher: normalizedUser?.role === 'TEACHER',
    isStudent: normalizedUser?.role === 'STUDENT',
    login,
    register,
    verifyEmail,
    loginWithGoogle,
    unlinkGoogle,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
