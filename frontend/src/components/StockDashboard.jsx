import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const StockDashboard = () => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [debouncedSymbol, setDebouncedSymbol] = useState('');
  
  // Single stock search states
  const [singleStock, setSingleStock] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState('');
  const [singleLastUpdated, setSingleLastUpdated] = useState(null);
  
  // All stocks listing states
  const [allStocks, setAllStocks] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState('');
  const [allLastUpdated, setAllLastUpdated] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);

  // Debounce the search input to avoid excessive requests
  useEffect(() => {
    if (!searchSymbol.trim()) {
      setDebouncedSymbol('');
      setSingleStock(null);
      setSingleError('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSymbol(searchSymbol.trim().toUpperCase());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchSymbol]);

  // Fetch all stocks list
  const fetchAllStocks = async (showLoader = false) => {
    if (showLoader) setAllLoading(true);
    setIsUpdating(true);
    try {
      const res = await api.get('/api/stocks');
      setAllStocks(res.data);
      setAllLastUpdated(new Date());
      setAllError('');
    } catch (err) {
      console.error('Error fetching all stocks:', err);
      setAllError('Failed to refresh stock listings.');
    } finally {
      if (showLoader) setAllLoading(false);
      setTimeout(() => setIsUpdating(false), 800);
    }
  };

  // Fetch single stock quote
  const fetchSingleStock = async (symbol, showLoader = false) => {
    if (showLoader) {
      setSingleLoading(true);
      setSingleError('');
    }
    setIsUpdating(true);
    try {
      const res = await api.get(`/api/stocks?symbol=${symbol}`);
      if (res.data) {
        setSingleStock(res.data);
        setSingleLastUpdated(new Date(res.data.lastUpdated || Date.now()));
        setSingleError('');
      } else {
        setSingleError('No quote returned.');
      }
    } catch (err) {
      console.error('Error fetching single stock:', err);
      const errMsg = err.response?.data?.message || 'Failed to fetch quote.';
      setSingleError(errMsg);
    } finally {
      if (showLoader) setSingleLoading(false);
      setTimeout(() => setIsUpdating(false), 800);
    }
  };

  // Polling for All Stocks: runs continuously every 5 seconds
  useEffect(() => {
    fetchAllStocks(true);
    const interval = setInterval(() => {
      fetchAllStocks(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Polling for Single Stock: runs when a symbol is debounced
  useEffect(() => {
    if (!debouncedSymbol) return;
    fetchSingleStock(debouncedSymbol, true);
    const interval = setInterval(() => {
      fetchSingleStock(debouncedSymbol, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [debouncedSymbol]);

  const isPriceUp = singleStock ? singleStock.change >= 0 : false;
  const priceColorClass = isPriceUp ? 'price-up' : 'price-down';
  const priceBadgeClass = isPriceUp ? 'price-up-bg' : 'price-down-bg';
  const trendIcon = isPriceUp ? 'bi-arrow-up-right' : 'bi-arrow-down-left';

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h2 className="text-white fw-bold mb-0">Live Market Dashboard</h2>
          <p className="text-muted mb-0">Real-time polling tracker showing live values for all listed companies.</p>
        </div>
        <div className="text-md-end text-muted font-monospace small d-flex align-items-center gap-2 justify-content-md-end">
          <span className={`pulse-indicator ${isUpdating ? 'live' : 'offline'}`} style={{ transition: 'all 0.3s' }}></span>
          <span>{isUpdating ? 'Syncing...' : 'Real-time Polling (5s)'}</span>
        </div>
      </div>

      {/* Ticker Search & Individual Tracker Row */}
      <div className="row g-4 mb-4">
        {/* Search Panel Card */}
        <div className="col-12 col-md-5">
          <div className="glass-card h-100">
            <h5 className="text-white fw-bold mb-3">Lookup Ticker Quote</h5>
            <p className="text-muted small mb-3">
              Enter any ticker (e.g., AAPL, TSLA, INFY) to poll live values.
            </p>
            
            <div className="position-relative mb-3">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input
                type="text"
                className="form-control form-control-custom ps-5 text-uppercase fw-semibold"
                placeholder="Enter stock symbol (e.g., TSLA)..."
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
              />
            </div>

            {singleError && (
              <div className="alert alert-custom alert-custom-danger d-flex align-items-center gap-2 mb-0 py-2.5" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div className="small">{singleError}</div>
              </div>
            )}

            {!debouncedSymbol && (
              <div className="text-center py-3 text-muted border border-dashed rounded-3">
                <i className="bi bi-search fs-4 text-primary mb-1 d-block"></i>
                <span className="small">Search a symbol to open the live console</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Detail View */}
        <div className="col-12 col-md-7">
          {singleLoading ? (
            <div className="glass-card d-flex flex-column justify-content-center align-items-center h-100 py-4">
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">Loading ticker info...</span>
              </div>
              <span className="text-muted small">Requesting quote details...</span>
            </div>
          ) : singleStock ? (
            <div className="glass-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="badge bg-primary-subtle text-primary fw-bold text-uppercase px-2.5 py-1 mb-1 d-inline-block" style={{ fontSize: '0.65rem' }}>
                      Active Live Stream
                    </span>
                    <h2 className="text-white fw-bold mb-0 font-monospace">{singleStock.symbol}</h2>
                  </div>
                  <span className={`badge ${priceBadgeClass} d-flex align-items-center gap-1 px-2.5 py-1.5 fw-bold`} style={{ borderRadius: '6px', fontSize: '0.8rem' }}>
                    <i className={`bi ${trendIcon}`}></i>
                    {isPriceUp ? '+' : ''}{singleStock.changePercent.toFixed(2)}%
                  </span>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Price</div>
                    <div className={`fs-3 fw-bold font-monospace ${priceColorClass}`}>
                      ${singleStock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>Change</div>
                    <div className={`fs-3 fw-bold font-monospace ${priceColorClass}`}>
                      {isPriceUp ? '+' : ''}{singleStock.change.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)', fontSize: '0.75rem' }}>
                <span className="text-muted">Last Updated: {singleLastUpdated ? singleLastUpdated.toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="glass-card d-flex flex-column justify-content-center align-items-center h-100 py-4 text-muted border border-dashed">
              <i className="bi bi-activity fs-2 mb-2 text-primary"></i>
              <h6 className="text-white fw-bold mb-1">Live Tracker Console</h6>
              <p className="small mb-0 px-4 text-center">Look up a ticker symbol on the left card to activate the live feed.</p>
            </div>
          )}
        </div>
      </div>

      {/* All Companies Real-Time Polling Section */}
      <div className="glass-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="text-white fw-bold mb-0">Market Securities Prices (Live Polled 5s)</h5>
            <p className="text-muted small mb-0">Automatic real-time valuations for all listed companies in the sandbox.</p>
          </div>
          {allLastUpdated && (
            <span className="text-muted small font-monospace">Sync: {allLastUpdated.toLocaleTimeString()}</span>
          )}
        </div>

        {allLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading market values...</span>
            </div>
          </div>
        ) : allError ? (
          <div className="alert alert-custom alert-custom-danger text-center py-4">
            <i className="bi bi-exclamation-triangle-fill fs-4 d-block mb-2"></i>
            {allError}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>Sector</th>
                  <th className="text-end">Live Price</th>
                  <th className="text-end">Change</th>
                  <th className="text-end">Change (%)</th>
                </tr>
              </thead>
              <tbody>
                {allStocks.map((stock) => {
                  const isUp = stock.change >= 0;
                  const priceClass = isUp ? 'price-up' : 'price-down';
                  const badgeClass = isUp ? 'price-up-bg' : 'price-down-bg';
                  return (
                    <tr key={stock._id}>
                      <td className="fw-bold text-white fs-5 font-monospace">{stock.symbol}</td>
                      <td>
                        <div className="fw-semibold text-white">{stock.name}</div>
                        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Vol: {stock.volume.toLocaleString()}</div>
                      </td>
                      <td>
                        <span className="badge bg-secondary text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>
                          {stock.sector}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-white font-monospace fs-5">${stock.price.toFixed(2)}</td>
                      <td className={`text-end fw-semibold font-monospace ${priceClass}`}>{isUp ? '+' : ''}{stock.change.toFixed(2)}</td>
                      <td className="text-end font-monospace">
                        <span className={`badge ${badgeClass} fw-bold px-2 py-1`} style={{ borderRadius: '6px' }}>
                          {isUp ? '↑ +' : '↓ '}{stock.changePercent.toFixed(2)}%
                        </span>
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

export default StockDashboard;
