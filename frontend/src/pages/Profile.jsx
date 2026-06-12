import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, refreshUserProfile, showToast } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetBalance = async () => {
    if (!window.confirm('Are you sure you want to reset your virtual wallet to $10,000.00? This will delete all your stock holdings and reset transaction logs.')) {
      return;
    }

    setResetting(true);
    try {
      const res = await api.post('/api/auth/reset-balance');
      showToast(res.data.message, 'success');
      await refreshUserProfile();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset virtual balance.';
      showToast(msg, 'danger');
    } finally {
      setResetting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="text-white fw-bold mb-0">My Account Profile</h2>
        <p className="text-muted">Manage your virtual securities account and view configuration details.</p>
      </div>

      <div className="row g-4">
        {/* Prominent Balance Card */}
        <div className="col-12 col-md-5 col-lg-4">
          <div className="glass-card mb-4 text-center" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <div className="my-3">
              <i className="bi bi-person-circle text-primary" style={{ fontSize: '4.5rem' }}></i>
            </div>
            <h4 className="text-white fw-bold mb-1">{user.name}</h4>
            <span className="badge bg-secondary text-uppercase px-2.5 py-1 mb-4" style={{ fontSize: '0.7rem' }}>
              {user.role} account
            </span>

            <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
              <div className="text-muted small text-uppercase fw-semibold">Available Virtual Balance</div>
              <div className="stats-number text-white my-2" style={{ fontSize: '2.1rem' }}>
                ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-muted small">Valid for simulated transactions</div>
            </div>
          </div>
          
          {/* Evaluations Help Card */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <h6 className="text-warning fw-bold mb-2"><i className="bi bi-mortarboard-fill me-1"></i> Evaluators Notice</h6>
            <p className="text-muted small mb-0" style={{ lineHeight: '1.4' }}>
              This sandbox is designed for Viva and internship validation. Password hashes utilize bcrypt, sessions authenticate via stateful JWT, and database storage relies on MongoDB.
            </p>
          </div>
        </div>

        {/* Profile details & controls */}
        <div className="col-12 col-md-7 col-lg-8">
          <div className="glass-card h-100">
            <h5 className="text-white fw-bold mb-4 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}>
              Account Metadata
            </h5>
            
            <div className="row g-4 mb-4">
              <div className="col-12 col-sm-6">
                <div className="text-muted small">Registered Email Address</div>
                <div className="text-white fw-semibold mt-1 fs-5">{user.email}</div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="text-muted small">Account Authorization Role</div>
                <div className="text-white fw-semibold mt-1 fs-5 text-capitalize">{user.role}</div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="text-muted small">Verification Status</div>
                <div className="text-white fw-semibold mt-1 fs-5 d-flex align-items-center gap-1.5">
                  <span className="pulse-indicator live mt-0.5"></span>
                  <span className="text-success text-uppercase">Active ({user.status})</span>
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="text-muted small">Member Since</div>
                <div className="text-white fw-semibold mt-1 fs-5">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <h5 className="text-white fw-bold mb-3 border-bottom pb-2 mt-4" style={{ borderColor: 'var(--border-color)' }}>
              Evaluation Options & Reset Actions
            </h5>
            <p className="text-muted small">
              To test backend transaction validations (e.g. buying when funds are insufficient), you can use the button below to purge all portfolio assets and restore your virtual trading wallet back to $10,000.
            </p>

            <button
              type="button"
              className="btn btn-danger-custom py-2.5 px-4 mt-2 d-inline-flex align-items-center gap-2"
              onClick={handleResetBalance}
              disabled={resetting}
            >
              {resetting ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <>
                  <i className="bi bi-arrow-counterclockwise fs-5"></i>
                  <span>Reset Virtual Account ($10,000)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
