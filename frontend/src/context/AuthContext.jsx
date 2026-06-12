import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Load user details if token is stored
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Failed to load user profile on startup', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // Show a toast message
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  // Helper to remove a toast manually
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Login handler
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
        msg = 'Connection to backend server failed. Please ensure the server is running.';
      }
      showToast(msg, 'danger');
      return { success: false, error: msg };
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password, role });
      const { token: userToken, ...userData } = res.data;
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
      if (userData.role === 'admin') {
        showToast('Registration successful! Platform Admin account has been activated with $1,000,000 virtual balance.', 'success');
      } else {
        showToast('Registration successful! $10,000 has been credited to your virtual wallet.', 'success');
      }
      return { success: true, role: userData.role };
    } catch (error) {
      let msg = 'Registration failed.';
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.message === 'Network Error' || !error.response) {
        msg = 'Connection to backend server failed. Please ensure the server is running.';
      }
      showToast(msg, 'danger');
      return { success: false, error: msg };
    }
  };

  // Refresh user profile (updates balance, portfolio, status etc)
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

  // Logout handler
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
