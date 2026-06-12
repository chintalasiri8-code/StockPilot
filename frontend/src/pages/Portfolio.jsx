import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Portfolio = () => {
  const { user, refreshUserProfile } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStocksAndUserData = async () => {
    try {
      const res = await api.get('/api/stocks');
      setStocks(res.data);
      await refreshUserProfile();
    } catch (error) {
      console.error('Error refreshing portfolio details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocksAndUserData();

    // 30s background updates
    const interval = setInterval(fetchStocksAndUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute portfolio statistics
  const portfolioHoldings = (user?.portfolio || []).map((item) => {
    const freshStock = stocks.find((s) => s.symbol === item.symbol);
    const currentPrice = freshStock ? freshStock.price : item.averageBuyPrice;
    const previousPrice = freshStock ? freshStock.previousPrice : item.averageBuyPrice;
    
    const investment = Number((item.averageBuyPrice * item.quantity).toFixed(2));
    const currentValue = Number((currentPrice * item.quantity).toFixed(2));
    const profitLoss = Number((currentValue - investment).toFixed(2));
    const profitLossPercent = investment > 0 ? Number(((profitLoss / investment) * 100).toFixed(2)) : 0;

    return {
      ...item,
      currentPrice,
      investment,
      currentValue,
      profitLoss,
      profitLossPercent
    };
  });

  const totalInvestment = portfolioHoldings.reduce((sum, item) => sum + item.investment, 0);
  const currentPortfolioValue = portfolioHoldings.reduce((sum, item) => sum + item.currentValue, 0);
  const unrealizedProfitLoss = currentPortfolioValue - totalInvestment;
  const percentageReturn = totalInvestment > 0 ? (unrealizedProfitLoss / totalInvestment) * 100 : 0;

  // Identify Top and Worst performing stocks
  let topPerforming = null;
  let worstPerforming = null;

  if (portfolioHoldings.length > 0) {
    // Sort by percentage gain
    const sorted = [...portfolioHoldings].sort((a, b) => b.profitLossPercent - a.profitLossPercent);
    topPerforming = sorted[0];
    worstPerforming = sorted[sorted.length - 1];
  }

  // Doughnut Chart Setup for Allocation
  const allocationChartData = {
    labels: portfolioHoldings.map(h => h.symbol),
    datasets: [
      {
        data: portfolioHoldings.map(h => h.currentValue),
        backgroundColor: [
          '#6366f1', // Indigo
          '#10b981', // Green/Emerald
          '#06b6d4', // Cyan
          '#f59e0b', // Gold/Amber
          '#ec4899', // Pink
          '#8b5cf6', // Purple
          '#3b82f6', // Blue
          '#f43f5e'  // Rose
        ],
        borderColor: '#ffffff',
        borderWidth: 1.5
      }
    ]
  };

  const allocationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#475569',
          font: {
            family: 'Inter',
            size: 11
          },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#94a3b8',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        bodyFont: {
          family: 'Inter'
        },
        callbacks: {
          label: function(context) {
            const val = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((val / total) * 100).toFixed(1);
            return ` $${val.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading portfolio data...</span>
        </div>
      </div>
    );
  }

  const pnlClass = unrealizedProfitLoss >= 0 ? 'text-success' : 'text-danger';
  const pnlArrow = unrealizedProfitLoss >= 0 ? '↑ +' : '↓ ';

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-white fw-bold mb-0">Portfolio Analytics</h2>
        <p className="text-muted">Detailed view of your holdings, allocation, and virtual profitability status.</p>
      </div>

      {/* Prominent Balance and PnL Summary */}
      <div className="row g-4 mb-4">
        {/* Prominent Wallet Cash */}
        <div className="col-12 col-md-3">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <div className="text-muted small fw-semibold text-uppercase">Available Virtual Cash</div>
            <div className="stats-number text-white" style={{ fontSize: '1.9rem' }}>
              ${user?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small"><i className="bi bi-wallet2 me-1"></i> Cash ready to trade</div>
          </div>
        </div>

        {/* Current Value of Portfolio */}
        <div className="col-12 col-md-3">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-info)' }}>
            <div className="text-muted small fw-semibold text-uppercase">Total Holdings Value</div>
            <div className="stats-number text-white" style={{ fontSize: '1.9rem' }}>
              ${currentPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small"><i className="bi bi-graph-up me-1"></i> Current price value</div>
          </div>
        </div>

        {/* Total Investment */}
        <div className="col-12 col-md-3">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid #64748b' }}>
            <div className="text-muted small fw-semibold text-uppercase">Total Capital Invested</div>
            <div className="stats-number text-white" style={{ fontSize: '1.9rem' }}>
              ${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-muted small"><i className="bi bi-cash me-1"></i> Total cash spent</div>
          </div>
        </div>

        {/* Net Unrealized Profit/Loss */}
        <div className="col-12 col-md-3">
          <div className="glass-card h-100" style={{ borderLeft: `4px solid ${unrealizedProfitLoss >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
            <div className="text-muted small fw-semibold text-uppercase">Unrealized Profit / Loss</div>
            <div className={`stats-number ${pnlClass}`} style={{ fontSize: '1.9rem' }}>
              {pnlArrow}${Math.abs(unrealizedProfitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`fw-semibold small ${pnlClass}`}>
              {percentageReturn >= 0 ? '+' : ''}{percentageReturn.toFixed(2)}% Return
            </div>
          </div>
        </div>
      </div>

      {/* Performers and Allocation Visualization */}
      <div className="row g-4 mb-4">
        {/* Allocation doughnut chart */}
        <div className="col-12 col-lg-7">
          <div className="glass-card h-100">
            <h5 className="text-white fw-bold mb-3"><i className="bi bi-pie-chart text-primary me-2"></i>Holdings Asset Allocation</h5>
            {portfolioHoldings.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center h-100 text-muted pb-5" style={{ minHeight: '220px' }}>
                You do not own any stocks. Buy stocks to view asset allocation.
              </div>
            ) : (
              <div className="p-3" style={{ height: '240px' }}>
                <Doughnut data={allocationChartData} options={allocationChartOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Top & Worst Performing Stock */}
        <div className="col-12 col-lg-5">
          <div className="glass-card h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="text-white fw-bold mb-3"><i className="bi bi-award text-warning me-2"></i>Top & Worst Performers</h5>
              
              {portfolioHoldings.length === 0 ? (
                <div className="text-muted py-5 text-center">
                  Performers statistics populate once shares are purchased.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* Top Performer */}
                  {topPerforming && (
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="text-success small fw-bold text-uppercase"><i className="bi bi-arrow-up-circle-fill me-1"></i>Top Performer</div>
                          <div className="fs-5 text-white fw-bold mt-1">{topPerforming.symbol}</div>
                          <div className="text-muted small">{topPerforming.name}</div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-success font-monospace px-3 py-1.5 fs-6">
                            +{topPerforming.profitLossPercent.toFixed(2)}%
                          </span>
                          <div className="text-success font-monospace mt-1 small">+${topPerforming.profitLoss.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Worst Performer */}
                  {worstPerforming && (
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="text-danger small fw-bold text-uppercase"><i className="bi bi-arrow-down-circle-fill me-1"></i>Worst Performer</div>
                          <div className="fs-5 text-white fw-bold mt-1">{worstPerforming.symbol}</div>
                          <div className="text-muted small">{worstPerforming.name}</div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-danger font-monospace px-3 py-1.5 fs-6">
                            {worstPerforming.profitLossPercent.toFixed(2)}%
                          </span>
                          <div className="text-danger font-monospace mt-1 small">${worstPerforming.profitLoss.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-muted small mt-3 font-monospace">
              Based on comparison between average purchase price and current market values.
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Table List */}
      <div className="glass-card">
        <h5 className="text-white fw-bold mb-4"><i className="bi bi-list-stars text-primary me-2"></i>Holdings Details</h5>
        {portfolioHoldings.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-wallet-fill fs-3 mb-2 d-block"></i>
            Your portfolio is currently empty. Go to the <Link to="/" style={{ color: 'var(--color-primary)' }}>Dashboard</Link> to buy stocks.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th className="text-end">Shares Owned</th>
                  <th className="text-end">Avg Purchase Price</th>
                  <th className="text-end">Current Price</th>
                  <th className="text-end">Cost Basis</th>
                  <th className="text-end">Market Value</th>
                  <th className="text-end">Profit / Loss</th>
                  <th className="text-end">Details</th>
                </tr>
              </thead>
              <tbody>
                {portfolioHoldings.map((item) => {
                  const isGain = item.profitLoss >= 0;
                  const profitClass = isGain ? 'text-success' : 'text-danger';
                  const arrow = isGain ? '+' : '';
                  const rowBadgeClass = isGain ? 'price-up-bg' : 'price-down-bg';

                  return (
                    <tr key={item._id}>
                      <td className="fw-bold text-white fs-5">{item.symbol}</td>
                      <td><span className="fw-semibold text-white">{item.name}</span></td>
                      <td className="text-end font-monospace text-white fw-semibold">{item.quantity}</td>
                      <td className="text-end font-monospace">${item.averageBuyPrice.toFixed(2)}</td>
                      <td className="text-end font-monospace text-white fw-semibold">${item.currentPrice.toFixed(2)}</td>
                      <td className="text-end font-monospace">${item.investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="text-end font-monospace text-white fw-bold">${item.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="text-end font-monospace">
                        <span className={`badge ${rowBadgeClass} fw-bold px-2 py-1`}>
                          {arrow}{item.profitLossPercent.toFixed(2)}%
                        </span>
                        <div className={`${profitClass} small mt-1`} style={{ fontSize: '0.8rem' }}>
                          {arrow}${item.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="text-end">
                        <Link to={`/stocks/${item.stock}`} className="btn btn-sm btn-outline-light border-0 px-2.5 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <i className="bi bi-graph-up"></i>
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

export default Portfolio;
