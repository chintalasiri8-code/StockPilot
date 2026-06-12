import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { showToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State for viewing individual user details (portfolio + transactions)
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPortfolio, setUserPortfolio] = useState([]);
  const [userTransactions, setUserTransactions] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/api/admin/users?search=${search}`);
      setUsers(res.data);
    } catch (error) {
      console.error('Error loading users list:', error);
      showToast('Error loading traders directory', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Suspend/Reactivate user status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = nextStatus === 'active' ? 'reactivate' : 'suspend';
    
    if (!window.confirm(`Are you sure you want to ${actionText} this trader's account?`)) {
      return;
    }

    try {
      const res = await api.put(`/api/admin/users/${userId}/status`, { status: nextStatus });
      showToast(res.data.message, 'success');
      
      // Update local state
      setUsers(users.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u)));
      
      // Update selected modal user if open
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, status: nextStatus });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error updating user account status';
      showToast(msg, 'danger');
    }
  };

  // Open details modal
  const handleViewDetails = async (userObj) => {
    setSelectedUser(userObj);
    setModalLoading(true);
    setUserPortfolio([]);
    setUserTransactions([]);
    
    try {
      const res = await api.get(`/api/admin/users/${userObj._id}`);
      setUserPortfolio(res.data.user.portfolio || []);
      setUserTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Error fetching user detailed history:', error);
      showToast('Could not load portfolio and audit history', 'danger');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="text-warning fw-bold mb-0">User Account Management</h2>
          <p className="text-muted mb-0">Suspend or restore trader credentials, audit holdings and ledger.</p>
        </div>
        
        {/* Search */}
        <div className="position-relative" style={{ width: '100%', maxWidth: '300px' }}>
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          <input
            type="text"
            className="form-control form-control-custom ps-5"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading traders list...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-person-slash fs-3 mb-2 d-block"></i>
            No traders found matching your criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Trader Details</th>
                  <th>Email Address</th>
                  <th>Joined Date</th>
                  <th className="text-end">Balance</th>
                  <th className="text-center">Account Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isActive = user.status === 'active';
                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="fw-bold text-white fs-6">{user.name}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Portfolio: {user.portfolio.length} items</div>
                      </td>
                      <td className="font-monospace">{user.email}</td>
                      <td className="text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="text-end fw-bold font-monospace text-white">
                        ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} text-uppercase px-2.5 py-1.5`} style={{ fontSize: '0.7rem' }}>
                          {user.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          {/* Toggle suspend */}
                          <button
                            type="button"
                            className={`btn btn-sm ${isActive ? 'btn-outline-danger' : 'btn-outline-success'} px-2.5 py-1.5 fw-semibold`}
                            onClick={() => handleToggleUserStatus(user._id, user.status)}
                          >
                            <i className={`bi ${isActive ? 'bi-shield-slash' : 'bi-shield-check'} me-1`}></i>
                            {isActive ? 'Suspend' : 'Activate'}
                          </button>
                          
                          {/* View details */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-light border-0 px-2.5 py-1.5"
                            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                            data-bs-toggle="modal"
                            data-bs-target="#userAuditModal"
                            onClick={() => handleViewDetails(user)}
                          >
                            <i className="bi bi-eye"></i> Audit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bootstrap Modal for User Audit */}
      <div className="modal fade" id="userAuditModal" tabIndex="-1" aria-labelledby="userAuditModalLabel" aria-hidden="true" style={{ display: 'none' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            {selectedUser && (
              <>
                <div className="modal-header border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <h5 className="modal-title text-white fw-bold" id="userAuditModalLabel">
                      Trader Audit: {selectedUser.name}
                    </h5>
                    <span className="text-muted small font-monospace">{selectedUser.email}</span>
                  </div>
                  <button type="button" className="btn-close btn-close-white" data-bs-toggle="modal" data-bs-target="#userAuditModal" aria-label="Close"></button>
                </div>
                
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {modalLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading audit records...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Financial statistics summary */}
                      <div className="row g-3 mb-4">
                        <div className="col-12 col-sm-6">
                          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                            <span className="text-muted small">Available Trading Balance</span>
                            <h4 className="text-white fw-bold mt-1 font-monospace">
                              ${selectedUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h4>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6">
                          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                            <span className="text-muted small">Account Status</span>
                            <div className="mt-1 d-flex align-items-center gap-2">
                              <span className={`badge ${selectedUser.status === 'active' ? 'bg-success' : 'bg-danger'} text-uppercase`}>
                                {selectedUser.status}
                              </span>
                              <button
                                type="button"
                                className="btn btn-link text-warning p-0 small text-decoration-none fw-semibold ms-auto"
                                onClick={() => handleToggleUserStatus(selectedUser._id, selectedUser.status)}
                              >
                                Toggle
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Portfolio Holdings */}
                      <h6 className="text-white fw-bold mb-3"><i className="bi bi-wallet2 text-primary me-2"></i>Portfolio Holdings</h6>
                      {userPortfolio.length === 0 ? (
                        <div className="alert alert-custom text-muted mb-4 py-3 text-center small">
                          This user currently does not hold any stock shares in their portfolio.
                        </div>
                      ) : (
                        <div className="table-responsive mb-4">
                          <table className="table custom-table table-sm" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>Symbol</th>
                                <th>Company</th>
                                <th className="text-end">Shares</th>
                                <th className="text-end">Avg Purchase Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userPortfolio.map((item) => (
                                <tr key={item._id}>
                                  <td className="fw-bold text-white">{item.symbol}</td>
                                  <td>{item.name}</td>
                                  <td className="text-end font-monospace text-white">{item.quantity}</td>
                                  <td className="text-end font-monospace">${item.averageBuyPrice.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Transactions History */}
                      <h6 className="text-white fw-bold mb-3"><i className="bi bi-clock-history text-primary me-2"></i>Ledger Activity</h6>
                      {userTransactions.length === 0 ? (
                        <div className="alert alert-custom text-muted py-3 text-center small">
                          No transactions recorded for this user.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table custom-table table-sm" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>Timestamp</th>
                                <th>Stock</th>
                                <th>Action</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Total Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userTransactions.map((tx) => (
                                <tr key={tx._id}>
                                  <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </td>
                                  <td className="fw-bold text-white">{tx.symbol}</td>
                                  <td>
                                    <span className={`badge ${tx.type === 'buy' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} text-uppercase`}>
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className="text-end font-monospace text-white">{tx.quantity}</td>
                                  <td className="text-end font-monospace">${tx.price.toFixed(2)}</td>
                                  <td className="text-end font-monospace text-white">${tx.totalAmount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
