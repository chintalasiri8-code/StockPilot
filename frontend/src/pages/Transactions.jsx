import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/trades/history');
      setTransactions(res.data);
    } catch (error) {
      console.error('Error fetching transactions history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) =>
    t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="text-white fw-bold mb-0">Transaction History</h2>
          <p className="text-muted mb-0">Audit log of all your virtual stock buy and sell executions.</p>
        </div>
        
        {/* Search */}
        <div className="position-relative" style={{ width: '100%', maxWidth: '280px' }}>
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          <input
            type="text"
            className="form-control form-control-custom ps-5"
            placeholder="Search by symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading transactions...</span>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-clock-history fs-3 mb-2 d-block"></i>
            No transactions found. Go execute some trades first!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Stock Symbol</th>
                  <th>Company Name</th>
                  <th>Type</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-end">Share Price</th>
                  <th className="text-end">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isBuy = tx.type === 'buy';
                  const badgeClass = isBuy ? 'price-up-bg text-success' : 'price-down-bg text-danger';
                  
                  return (
                    <tr key={tx._id}>
                      <td className="text-muted">
                        {new Date(tx.date).toLocaleDateString()} at{' '}
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="fw-bold text-white">{tx.symbol}</td>
                      <td>{tx.name}</td>
                      <td>
                        <span className={`badge ${badgeClass} text-uppercase fw-bold px-2.5 py-1.5`} style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="text-end font-monospace text-white">{tx.quantity}</td>
                      <td className="text-end font-monospace text-white">${tx.price.toFixed(2)}</td>
                      <td className="text-end font-monospace text-white fw-bold">
                        ${tx.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

export default Transactions;
