import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StockChart from '../components/StockChart';

const StockDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUserProfile, showToast } = useAuth();
  
  const [stock, setStock] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch stock detail & history
  const fetchStockData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get(`/api/stocks/${id}`);
      setStock(res.data.stock);
      setPriceHistory(res.data.priceHistory);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stock details:', error);
      showToast('Error loading stock information', 'danger');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(true);
    refreshUserProfile();

    // Set up 30-second automatic refresh
    const interval = setInterval(() => {
      fetchStockData(false);
      refreshUserProfile();
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  // Find owned quantity of this stock
  const getOwnedQuantity = () => {
    if (!user || !user.portfolio || !stock) return 0;
    const portfolioItem = user.portfolio.find(
      (item) => item.stock.toString() === stock._id.toString()
    );
    return portfolioItem ? portfolioItem.quantity : 0;
  };

  const ownedQty = getOwnedQuantity();

  // Handle transaction submit
  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    
    // Quantity validation: prevent zero/negative
    if (quantity <= 0) {
      showToast('Please enter a valid quantity greater than zero', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = tradeType === 'buy' ? '/api/trades/buy' : '/api/trades/sell';
      const res = await api.post(endpoint, {
        stockId: stock._id,
        quantity: quantity
      });

      showToast(res.data.message, 'success');
      setQuantity(1);
      
      // Refresh balance, portfolio and stock prices immediately
      await refreshUserProfile();
      await fetchStockData(false);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Transaction failed. Please try again.';
      showToast(errMsg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading stock details...</span>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="container py-5 text-center text-muted">
        <i className="bi bi-exclamation-triangle fs-1 mb-2 text-warning"></i>
        <h3>Stock Not Found</h3>
        <p>The stock you are looking for does not exist in our simulator database.</p>
        <Link to="/" className="btn btn-primary-custom mt-3">Back to Dashboard</Link>
      </div>
    );
  }

  const isUp = stock.change >= 0;
  const priceClass = isUp ? 'price-up' : 'price-down';
  const badgeClass = isUp ? 'price-up-bg' : 'price-down-bg';
  const totalTradeCost = Number((stock.price * quantity).toFixed(2));

  return (
    <div className="container-fluid px-4 py-4">
      {/* Back navigation */}
      <div className="mb-4">
        <Link to="/" className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrow-left"></i>
          <span>Back to Market Dashboard</span>
        </Link>
      </div>

      <div className="row g-4">
        {/* Left column: Stock Info and Charts */}
        <div className="col-12 col-lg-8">
          <div className="glass-card mb-4">
            {/* Header info */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <span className="badge bg-secondary text-uppercase mb-1">{stock.sector}</span>
                <h1 className="text-white fw-bold mb-0" style={{ fontSize: '2.5rem' }}>
                  {stock.name} <span className="text-muted fw-semibold font-monospace" style={{ fontSize: '1.5rem' }}>({stock.symbol})</span>
                </h1>
              </div>

              <div className="text-md-end">
                <div className="text-muted font-monospace small mb-1">Last Update: {lastUpdated.toLocaleTimeString()}</div>
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-2 fw-bold text-white font-monospace">${stock.price.toFixed(2)}</span>
                  <span className={`badge ${badgeClass} fs-5 fw-bold px-2 py-1`} style={{ borderRadius: '6px' }}>
                    {isUp ? '↑ +' : '↓ '}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted mb-4">{stock.description}</p>

            {/* Chart */}
            <div className="mb-2">
              <h5 className="text-white fw-bold mb-3"><i className="bi bi-graph-up text-primary me-2"></i>Live Market History</h5>
              <div className="p-2 rounded-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <StockChart symbol={stock.symbol} priceHistory={priceHistory} />
              </div>
            </div>

            {/* Grid of details */}
            <div className="row g-3 mt-3 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
              <div className="col-6 col-sm-3">
                <div className="text-muted small">Previous Close</div>
                <div className="text-white fw-bold font-monospace">${stock.previousPrice.toFixed(2)}</div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="text-muted small">Change ($)</div>
                <div className={`fw-bold font-monospace ${priceClass}`}>{isUp ? '+' : ''}{stock.change.toFixed(2)}</div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="text-muted small">Trading Volume</div>
                <div className="text-white fw-bold font-monospace">{stock.volume.toLocaleString()}</div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="text-muted small">Market Cap</div>
                <div className="text-white fw-bold font-monospace">${(stock.marketCap / 1e9).toFixed(2)}B</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Trade Action Panel */}
        <div className="col-12 col-lg-4">
          {/* Virtual Portfolio status card */}
          <div className="glass-card mb-4" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h5 className="text-white fw-bold mb-3"><i className="bi bi-wallet2 text-primary me-2"></i>Virtual Balance Summary</h5>
            <div className="mb-2">
              <div className="text-muted small">Available Cash Balance</div>
              <div className="fs-3 fw-bold text-white">
                ${user?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
              <div className="text-muted small">Currently Owned Quantity</div>
              <div className="fs-5 fw-bold text-white">{ownedQty} Shares</div>
            </div>
          </div>

          {/* Interactive Trade Execution Card */}
          <div className="glass-card">
            <h5 className="text-white fw-bold mb-3"><i className="bi bi-lightning-fill text-warning me-2"></i>Execute Transaction</h5>
            
            {/* Suspended stock notification */}
            {stock.isSuspended ? (
              <div className="alert alert-custom alert-custom-danger mb-0" role="alert">
                <i className="bi bi-slash-circle me-2"></i>
                <strong>Trading Suspended:</strong> This stock is currently disabled for trading by the platform administrator.
              </div>
            ) : (
              <form onSubmit={handleExecuteTrade}>
                {/* Buy/Sell tab toggle */}
                <div className="d-flex mb-4 p-1.5 rounded-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold transition-all ${tradeType === 'buy' ? 'btn-success-custom' : 'text-muted'}`}
                    onClick={() => { setTradeType('buy'); setQuantity(1); }}
                    style={{ borderRadius: '8px' }}
                  >
                    BUY SHARES
                  </button>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold transition-all ${tradeType === 'sell' ? 'btn-danger-custom' : 'text-muted'}`}
                    onClick={() => { setTradeType('sell'); setQuantity(Math.min(1, ownedQty)); }}
                    style={{ borderRadius: '8px' }}
                  >
                    SELL SHARES
                  </button>
                </div>

                {/* Input Fields */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">Quantity to {tradeType === 'buy' ? 'Buy' : 'Sell'}</label>
                  <input
                    type="number"
                    className="form-control form-control-custom text-center fs-4 font-monospace"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1"
                    max={tradeType === 'sell' ? ownedQty : undefined}
                    required
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>Stock Price:</span>
                    <span className="font-monospace text-white">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold border-top pt-2" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-white">{tradeType === 'buy' ? 'Total Cost:' : 'Total Proceeds:'}</span>
                    <span className="font-monospace fs-4 text-white">${totalTradeCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Validation Warnings on UI */}
                {tradeType === 'buy' && user?.balance < totalTradeCost && (
                  <div className="alert alert-custom alert-custom-danger mb-3 py-2" style={{ fontSize: '0.8rem' }} role="alert">
                    <i className="bi bi-exclamation-octagon me-1"></i> Insufficient funds to execute purchase.
                  </div>
                )}
                {tradeType === 'sell' && ownedQty < quantity && (
                  <div className="alert alert-custom alert-custom-danger mb-3 py-2" style={{ fontSize: '0.8rem' }} role="alert">
                    <i className="bi bi-exclamation-octagon me-1"></i> Insufficient shares owned. You only own {ownedQty}.
                  </div>
                )}

                {/* Execution Button */}
                <button
                  type="submit"
                  className={`btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${tradeType === 'buy' ? 'btn-success-custom' : 'btn-danger-custom'}`}
                  disabled={
                    isSubmitting ||
                    (tradeType === 'buy' && user?.balance < totalTradeCost) ||
                    (tradeType === 'sell' && ownedQty < quantity)
                  }
                >
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <i className={`bi ${tradeType === 'buy' ? 'bi-cart-check' : 'bi-cash-coin'} fs-5`}></i>
                      <span>EXECUTE {tradeType.toUpperCase()} ORDER</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
