import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 h-100" style={{ width: '260px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', minHeight: 'calc(100vh - 73px)' }}>
      <ul className="nav nav-pills flex-column mb-auto gap-1">
        {/* User Dashboard Section */}
        {user && user.role === 'user' && (
          <>
            <div className="text-uppercase text-muted fw-bold mb-3 px-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              Trading Center
            </div>
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-graph-up-arrow fs-5"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/portfolio" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-wallet2 fs-5"></i>
                <span>Portfolio</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-clock-history fs-5"></i>
                <span>Transactions</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-person fs-5"></i>
                <span>Profile Page</span>
              </NavLink>
            </li>
          </>
        )}

        {/* Admin Dashboard Section */}
        {user && user.role === 'admin' && (
          <>
            <div className="text-uppercase text-warning fw-bold mb-3 px-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              Admin Panel
            </div>
            <li>
              <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-speedometer2 fs-5 text-warning"></i>
                <span>Admin Analytics</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-people fs-5 text-warning"></i>
                <span>User Management</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/stocks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-folder-plus fs-5 text-warning"></i>
                <span>Stock Management</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <i className="bi bi-receipt-cutoff fs-5 text-warning"></i>
                <span>Transactions Log</span>
              </NavLink>
            </li>
          </>
        )}
      </ul>
      
      <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
        <div className="d-flex align-items-center gap-2 px-3 text-muted" style={{ fontSize: '0.85rem' }}>
          <i className="bi bi-shield-lock-fill text-success"></i>
          <span>Secure Sandbox Environment</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
