import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastNotification from './components/ToastNotification';
import StockDashboard from './components/StockDashboard';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AccessDenied from './pages/AccessDenied';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminStocks from './pages/AdminStocks';
import AdminTransactions from './pages/AdminTransactions';

// Component to handle dynamic redirection from root '/'
const RootRedirect = () => {
  const { token, user } = useAuth();
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return user.role === 'admin' ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// Main Layout Wrapper
const AppLayout = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading StockPilot...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 overflow-auto" style={{ minHeight: 'calc(100vh - 73px)' }}>
          <Routes>

            {/* Redirect root based on login status */}
            <Route path="/" element={<RootRedirect />} />

            {/* User Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stocks" element={<ProtectedRoute><StockDashboard /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/stocks/:id" element={<ProtectedRoute><StockDetail /></ProtectedRoute>} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/stocks" element={<AdminRoute><AdminStocks /></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Top-level App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* App Layout */}
          <Route path="/*" element={<AppLayout />} />

        </Routes>

        <ToastNotification />
      </AuthProvider>
    </Router>
  );
}

export default App;