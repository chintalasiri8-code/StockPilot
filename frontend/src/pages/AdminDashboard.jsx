import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/admin/analytics');
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading system analytics...</span>
        </div>
      </div>
    );
  }

  // Bar Chart Configuration for Most Traded Stocks
  const chartData = {
    labels: analytics?.mostTradedStocks.map(s => s.symbol) || [],
    datasets: [
      {
        label: 'Transaction Count',
        data: analytics?.mostTradedStocks.map(s => s.count) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: '#6366f1',
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        bodyFont: { family: 'Inter' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(15, 23, 42, 0.06)' },
        ticks: { color: '#475569' }
      },
      y: {
        grid: { color: 'rgba(15, 23, 42, 0.06)' },
        ticks: { color: '#475569', precision: 0 }
      }
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-warning fw-bold mb-0">Admin Platform Analytics</h2>
        <p className="text-muted">Oversee system activity, transaction volume, and simulated stock updates.</p>
      </div>

      {/* Analytics Summary Grid */}
      <div className="row g-4 mb-4">
        {/* Total Registered Users */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Registered Traders</div>
                <div className="stats-number text-white">{analytics?.totalUsers}</div>
              </div>
              <i className="bi bi-people-fill text-primary fs-3"></i>
            </div>
            <div className="text-muted small mt-2">Active sandbox user accounts</div>
          </div>
        </div>

        {/* Total Stocks Available */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-info)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Listed Securities</div>
                <div className="stats-number text-white">{analytics?.totalStocks}</div>
              </div>
              <i className="bi bi-file-earmark-bar-graph text-info fs-3"></i>
            </div>
            <div className="text-muted small mt-2">Active entries in simulator</div>
          </div>
        </div>

        {/* Total Transactions Executed */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Total Trades</div>
                <div className="stats-number text-white">{analytics?.totalTransactions}</div>
              </div>
              <i className="bi bi-arrow-left-right text-warning fs-3"></i>
            </div>
            <div className="text-muted small mt-2">All-time buys and sells log</div>
          </div>
        </div>

        {/* Total Trading Volume */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card h-100" style={{ borderLeft: '4px solid var(--color-success)' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted small fw-semibold text-uppercase">Trading Volume</div>
                <div className="stats-number text-white">
                  ${analytics?.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <i className="bi bi-currency-dollar text-success fs-3"></i>
            </div>
            <div className="text-muted small mt-2">Sum of transaction total amounts</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Most Traded Stocks Chart */}
        <div className="col-12 col-lg-7">
          <div className="glass-card h-100">
            <h5 className="text-white fw-bold mb-3"><i className="bi bi-bar-chart-fill text-primary me-2"></i>Most Traded Securities</h5>
            {analytics?.mostTradedStocks.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center h-100 text-muted py-5">
                No trades have been executed on the platform yet.
              </div>
            ) : (
              <div style={{ height: '300px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Most Traded Stocks Details List */}
        <div className="col-12 col-lg-5">
          <div className="glass-card h-100">
            <h5 className="text-white fw-bold mb-3"><i className="bi bi-star-fill text-warning me-2"></i>Popular Stocks Detail</h5>
            {analytics?.mostTradedStocks.length === 0 ? (
              <div className="text-muted py-5 text-center">
                System popularity logs populate when transactions begin.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {analytics?.mostTradedStocks.map((stock, idx) => (
                  <div key={stock.symbol} className="d-flex justify-content-between align-items-center p-2.5 rounded-3" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex align-items-center gap-2.5">
                      <span className="badge bg-secondary font-monospace" style={{ minWidth: '24px' }}>#{idx + 1}</span>
                      <div>
                        <div className="fw-bold text-white font-monospace">{stock.symbol}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{stock.name}</div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-white small">{stock.count} trades</div>
                      <div className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>Vol: ${stock.volume.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
