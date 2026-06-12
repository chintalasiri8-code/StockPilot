import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminTransactions = () => {
  const { showToast } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterStock, setFilterStock] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [userSearch, setUserSearch] = useState(''); // Text search on pop-populated name/email

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Build query string
      let query = [];
      if (filterStock) query.push(`stock=${filterStock}`);
      if (filterDate) query.push(`date=${filterDate}`);
      
      const queryString = query.length > 0 ? `?${query.join('&')}` : '';
      const res = await api.get(`/api/admin/transactions${queryString}`);
      setTransactions(res.data);
    } catch (error) {
      console.error('Error fetching admin transactions:', error);
      showToast('Error loading platform audit logs', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterStock, filterDate]); // Re-fetch on filter change

  // Frontend search filter for User details since populate returns user objects
  const filteredTransactions = transactions.filter((tx) => {
    if (!userSearch) return true;
    const searchVal = userSearch.toLowerCase();
    const userName = tx.user?.name?.toLowerCase() || '';
    const userEmail = tx.user?.email?.toLowerCase() || '';
    return userName.includes(searchVal) || userEmail.includes(searchVal);
  });

  const handleClearFilters = () => {
    setFilterStock('');
    setFilterDate('');
    setUserSearch('');
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-warning fw-bold mb-0">Platform Transaction Audit Log</h2>
        <p className="text-muted">Monitor and audit all virtual stock trades executed by users across the application.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card mb-4">
        <h6 className="text-white fw-bold mb-3"><i className="bi bi-funnel text-primary me-2"></i>Filter Logs</h6>
        <div className="row g-3">
          {/* User Search */}
          <div className="col-12 col-md-4">
            <label className="form-label text-muted small">Search by User Name/Email</label>
            <div className="position-relative">
              <i className="bi bi-person position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input
                type="text"
                className="form-control form-control-custom ps-5"
                placeholder="e.g. John Doe"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Stock Symbol */}
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label text-muted small">Stock Symbol</label>
            <input
              type="text"
              className="form-control form-control-custom text-uppercase font-monospace"
              placeholder="e.g. TSLA"
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
            />
          </div>

          {/* Date Picker */}
          <div className="col-12 col-sm-6 col-md-3">
            <label className="form-label text-muted small">Transaction Date</label>
            <input
              type="date"
              className="form-control form-control-custom font-monospace"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="col-12 col-md-2 d-flex align-items-end gap-2">
            <button
              type="button"
              className="btn btn-outline-light border-0 w-100 py-2 fw-semibold"
              onClick={handleClearFilters}
              style={{ backgroundColor: 'var(--bg-input)' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="glass-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading platform log...</span>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-clipboard-x fs-3 mb-2 d-block"></i>
            No matching transactions found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Trader Name / Email</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-end">Execution Price</th>
                  <th className="text-end">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isBuy = tx.type === 'buy';
                  return (
                    <tr key={tx._id}>
                      <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {new Date(tx.date).toLocaleDateString()} at{' '}
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        {tx.user ? (
                          <>
                            <div className="fw-semibold text-white">{tx.user.name}</div>
                            <div className="text-muted small font-monospace" style={{ fontSize: '0.75rem' }}>{tx.user.email}</div>
                          </>
                        ) : (
                          <span className="text-danger small italic">[User Deleted]</span>
                        )}
                      </td>
                      <td className="fw-bold text-white fs-6 font-monospace">{tx.symbol}</td>
                      <td>
                        <span className={`badge ${isBuy ? 'price-up-bg text-success' : 'price-down-bg text-danger'} text-uppercase fw-bold px-2.5 py-1.5`} style={{ borderRadius: '6px' }}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="text-end font-monospace text-white">{tx.quantity}</td>
                      <td className="text-end font-monospace text-white">${tx.price.toFixed(2)}</td>
                      <td className="text-end font-monospace text-white fw-bold">
                        ${tx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
