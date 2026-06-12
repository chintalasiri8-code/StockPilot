import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockChart = ({ symbol, priceHistory = [] }) => {
  if (priceHistory.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center w-100 h-100" style={{ minHeight: '300px' }}>
        <p className="text-muted text-center">No price history available. Waiting for simulator tick...</p>
      </div>
    );
  }

  // Format labels & values
  const labels = priceHistory.map((point) => {
    const d = new Date(point.timestamp);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const prices = priceHistory.map((point) => point.price);
  
  // Decide theme color based on price direction (gains = green, loss = red)
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isUp = lastPrice >= firstPrice;
  
  const themeColor = isUp ? '#10b981' : '#ef4444';
  const glowColor = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  const data = {
    labels,
    datasets: [
      {
        label: `${symbol} Price ($)`,
        data: prices,
        borderColor: themeColor,
        backgroundColor: glowColor,
        borderWidth: 2,
        pointBackgroundColor: themeColor,
        pointBorderColor: 'rgba(255,255,255,0.7)',
        pointHoverRadius: 6,
        tension: 0.2, // Smooth curves
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#94a3b8',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 10,
        bodyFont: {
          family: 'Inter'
        },
        callbacks: {
          label: function(context) {
            return ` $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(15, 23, 42, 0.06)'
        },
        ticks: {
          color: '#475569',
          font: {
            size: 10,
            family: 'Inter'
          },
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: 'rgba(15, 23, 42, 0.06)'
        },
        ticks: {
          color: '#475569',
          font: {
            size: 10,
            family: 'Inter'
          },
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '350px', position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default StockChart;
