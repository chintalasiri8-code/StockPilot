import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // ✅ FIXED: Load user safely
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
          console.warn('API failed, using localStorage user');

          // ✅ IMPORTANT FIX: fallback to stored user instead of logout
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              console.error('Invalid stored user data');
            }
          }
          // ❌ DO NOT logout here
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // Toast system (unchanged)
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Login (unchanged)
  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token: userToken, ...userData } = res.data;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(userToken);
      setUser(userData);

      showToast(`Welcome back, ${userData.name}!`, 'success');
      return { success: true, role: userData.role };
    } catch (error) {
      let msg = 'Login failed. Please check credentials.';
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.message === 'Network Error' || !error.response) {
        msg = 'Connection to backend server failed.';
      }
      showToast(msg, 'danger');
      return { success: false, error: msg };
    }
  };

  // Register (unchanged)
  const register = async (name, email, password, role) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password, role });
      const { token: userToken, ...userData } = res.data;

      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(userToken);
      setUser(userData);

      showToast('Registration successful!', 'success');
      return { success: true, role: userData.role };
    } catch (error) {
      let msg = 'Registration failed.';
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      showToast(msg, 'danger');
      return { success: false, error: msg };
    }
  };

  // Refresh profile (unchanged)
  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  // Logout (unchanged)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUserProfile,
        toasts,
        showToast,
        removeToast
      }}
    >
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