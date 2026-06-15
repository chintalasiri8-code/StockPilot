import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLoader = () => (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}
  >
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <AuthLoader />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'user') {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <AuthLoader />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};
