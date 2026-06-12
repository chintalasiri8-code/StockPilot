import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const { user, refreshUserProfile } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch stocks list
  const fetchStocks = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/api/stocks');
      setStocks(res.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stock listings:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Setup 30s background price polling
  useEffect(() => {
    fetchStocks(true);
    refreshUserProfile(); // Refresh balance

    const interval = setInterval(() => {
      fetchStocks(false);
      refreshUserProfile();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter stocks based on search query
  const filteredStocks = stocks.filter((stock) => {
    const q = search.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q) ||
      stock.sector.toLowerCase().includes(q)
    );
  });

  // Calculate portfolio current market value
  const calculatePortfolioValue = () => {
    if (!user || !user.portfolio) return 0;
    return user.portfolio.reduce((sum, item) => {
      // Find current stock price from fresh stock state
      const currentStock = stocks.find((s) => s.symbol === item.symbol);
      const currentPrice = currentStock ? currentStock.price : item.averageBuyPrice;
      return sum + (currentPrice * item.quantity);
    }, 0);
  };

  const portfolioValue = calculatePortfolioValue();
  const netWorth = (user?.balance || 0) + portfolioValue;

  return (
    <div className="container-fluid px-4 py-4">
      {/* Top Banner / Welcome */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h2 className="text-white fw-bold mb-0">Market Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {user?.name}. Manage your virtual portfolio.</p>
        </div>
        <div className="text-md-end text-muted font-monospace small">
          <span className="pulse-indicator live"></span>
          Prices update automatically every 30s<br />
          Last sync: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Prominent Balance and Stats Summary Cards */}
      <div className="row g-4 mb-4">
        {/* Available Virtual Balance */}
        <div className="col-12 col-md-4">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <div className="text-muted small fw-semibold text-uppercase">Available Virtual Cash</div>
            <div className="stats-number text-white">
              ${user?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small">
              <i className="bi bi-wallet2 me-1"></i> Default starting balance: $10,000.00
            </div>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="col-12 col-md-4">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-info)' }}>
            <div className="text-muted small fw-semibold text-uppercase">Stock Holdings Value</div>
            <div className="stats-number text-white">
              ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small">
              <i className="bi bi-graph-up me-1"></i> Current valuation of owned shares
            </div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="col-12 col-md-4">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-success)' }}>
            <div className="text-muted small fw-semibold text-uppercase">Total Net Worth</div>
            <div className="stats-number" style={{ color: '#818cf8' }}>
              ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small">
              <i className="bi bi-cash-stack me-1"></i> Cash + Portfolio valuation
            </div>
          </div>
        </div>
      </div>

      {/* Stock Listings Card */}
      <div className="glass-card">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
          <h4 className="text-white fw-bold mb-0">Simulated Securities Market</h4>
          
          {/* Search bar */}
          <div className="position-relative" style={{ width: '100%', maxWidth: '320px' }}>
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input
              type="text"
              className="form-control form-control-custom ps-5"
              placeholder="Search symbol, name, or sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading stocks...</span>
            </div>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-info-circle fs-3 mb-2 d-block"></i>
            No stocks match your search query.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>Sector</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Change ($)</th>
                  <th className="text-end">Change (%)</th>
                  <th className="text-center">Trading</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isUp = stock.change >= 0;
                  const priceClass = isUp ? 'price-up' : 'price-down';
                  const badgeClass = isUp ? 'price-up-bg' : 'price-down-bg';
                  
                  return (
                    <tr key={stock._id}>
                      <td className="fw-bold text-white fs-5">{stock.symbol}</td>
                      <td>
                        <div className="fw-semibold text-white">{stock.name}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Vol: {stock.volume.toLocaleString()}</div>
                      </td>
                      <td>
                        <span className="badge bg-secondary text-uppercase fw-semibold" style={{ fontSize: '0.65rem', padding: '0.35em 0.6em' }}>
                          {stock.sector}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-white font-monospace fs-5">
                        ${stock.price.toFixed(2)}
                      </td>
                      <td className={`text-end fw-semibold font-monospace ${priceClass}`}>
                        {isUp ? '+' : ''}{stock.change.toFixed(2)}
                      </td>
                      <td className="text-end font-monospace">
                        <span className={`badge ${badgeClass} fw-bold px-2.5 py-1.5`} style={{ borderRadius: '6px' }}>
                          {isUp ? '↑ +' : '↓ '}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-center">
                        {stock.isSuspended ? (
                          <span className="badge bg-danger text-uppercase px-2 py-1" style={{ fontSize: '0.65rem' }}>SUSPENDED</span>
                        ) : (
                          <span className="badge bg-success-subtle text-success text-uppercase px-2 py-1" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        )}
                      </td>
                      <td className="text-end">
                        <Link to={`/stocks/${stock._id}`} className="btn btn-sm btn-outline-light border-0 px-3 py-1.5 fw-medium d-inline-flex align-items-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <i className="bi bi-graph-up"></i>
                          <span>Trade / Analysis</span>
                        </Link>
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

export default Dashboard;
