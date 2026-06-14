import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#090a0f' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ✅ Not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ IMPORTANT FIX:
  // Only block if user exists AND role is explicitly wrong
  if (user && user.role && user.role !== 'user') {
    return <Navigate to="/access-denied" replace />;
  }

  // ✅ Allow if user is still loading but token exists
  return children;
};

export const AdminRoute = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#090a0f' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in → login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Only restrict if role is confirmed and not admin
  if (user && user.role && user.role !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};