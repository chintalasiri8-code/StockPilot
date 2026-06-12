import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/image.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <div className="container-fluid px-4 py-2">
        <Link className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold fs-4" to={user && user.role === 'admin' ? '/admin' : '/'} style={{ fontFamily: 'Outfit' }}>
          <img src={logo} alt="StockPilot Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} /> StockPilot
        </Link>
        
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Left elements can go here */}
          </ul>
          
          <div className="d-flex align-items-center gap-4">
            {/* Live simulator indicator */}
            <div className="d-flex align-items-center text-muted font-monospace" style={{ fontSize: '0.85rem' }}>
              <span className="pulse-indicator live"></span>
              Live Feed (30s)
            </div>

            {user && (
              <>
                {/* Available Balance Prominent Display */}
                <div className="px-3 py-1.5 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Balance:</span>
                  <span className="text-white fw-bold" style={{ fontSize: '1.05rem', color: '#818cf8' }}>
                    ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* User Dropdown */}
                <div className="dropdown">
                  <button className="btn btn-outline-light dropdown-toggle d-flex align-items-center gap-2 border-0 px-3" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <i className="bi bi-person-circle fs-5" style={{ color: 'var(--color-primary)' }}></i>
                    <span className="fw-medium">{user.name}</span>
                    {user.role === 'admin' && <span className="badge bg-danger ms-1" style={{ fontSize: '0.65rem' }}>ADMIN</span>}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border mt-2" aria-labelledby="userDropdown" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    {user.role === 'user' && (
                      <>
                        <li>
                          <Link className="dropdown-item py-2" to="/profile">
                            <i className="bi bi-person me-2"></i>Profile
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item py-2" to="/portfolio">
                            <i className="bi bi-wallet2 me-2"></i>Portfolio
                          </Link>
                        </li>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <li>
                        <Link className="dropdown-item py-2 text-warning" to="/admin">
                          <i className="bi bi-speedometer2 me-2"></i>Admin Panel
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" style={{ backgroundColor: 'var(--border-color)' }} /></li>
                    <li>
                      <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
