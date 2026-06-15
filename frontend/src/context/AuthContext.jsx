import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
      }
    }
    return null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (error) {
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;
        const storedUser = localStorage.getItem('user');

        if (!isAuthError && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            console.warn('Profile refresh failed, using stored user data.');
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken('');
            setUser(null);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken('');
          setUser(null);
        }
      }

      setLoading(false);
    };

    fetchUser();
  }, [token]);

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
      } else if (error.message === 'Network Error' || !error.response) {
        msg = 'Connection to backend server failed.';
      }
      showToast(msg, 'danger');
      return { success: false, error: msg };
    }
  };

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

  const logout = (message = 'Logged out successfully') => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    if (message) {
      showToast(message, 'info');
    }
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
