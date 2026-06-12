import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center glass-card p-5" style={{ maxWidth: '480px' }}>
        <div className="mb-4">
          <i className="bi bi-shield-slash-fill text-danger" style={{ fontSize: '5rem' }}></i>
        </div>
        <h2 className="text-white fw-bold mb-2">Access Denied</h2>
        <h5 className="text-warning mb-3">HTTP 403 - Forbidden Area</h5>
        <p className="text-muted mb-4">
          Your account does not possess the administrator privileges required to view or execute operations on this module.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/" className="btn btn-primary-custom px-4 py-2">
            Go to Trading Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
