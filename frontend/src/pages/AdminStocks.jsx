import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminStocks = () => {
  const { showToast } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingStock, setEditingStock] = useState(null); // Null for Add, Stock object for Edit
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sector, setSector] = useState('Technology');
  const [description, setDescription] = useState('');
  const [volume, setVolume] = useState('1000000');
  const [marketCap, setMarketCap] = useState('100000000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStocks = async () => {
    try {
      const res = await api.get('/api/stocks');
      setStocks(res.data);
    } catch (error) {
      console.error('Error loading stocks:', error);
      showToast('Error loading securities list', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // Prepare form for Add Stock
  const handleOpenAdd = () => {
    setEditingStock(null);
    setSymbol('');
    setName('');
    setPrice('');
    setSector('Technology');
    setDescription('');
    setVolume('1000000');
    setMarketCap('100000000');
  };

  // Prepare form for Edit Stock
  const handleOpenEdit = (stockObj) => {
    setEditingStock(stockObj);
    setSymbol(stockObj.symbol);
    setName(stockObj.name);
    setPrice(stockObj.price.toString());
    setSector(stockObj.sector);
    setDescription(stockObj.description || '');
    setVolume(stockObj.volume.toString());
    setMarketCap(stockObj.marketCap.toString());
  };

  // Submit handler (handles both Add and Edit CRUD)
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!symbol || !name || !price || !sector) {
      showToast('Please populate all required fields', 'danger');
      return;
    }

    // Validation (prevent negative prices)
    if (parseFloat(price) <= 0) {
      showToast('Initial listing price must be greater than zero', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStock) {
        // Edit Action
        const res = await api.put(`/api/admin/stocks/${editingStock._id}`, {
          name,
          sector,
          description,
          volume,
          marketCap
        });
        showToast(`Stock ${res.data.symbol} updated successfully`, 'success');
        setStocks(stocks.map(s => s._id === editingStock._id ? res.data : s));
      } else {
        // Add Action
        const res = await api.post('/api/admin/stocks', {
          symbol,
          name,
          price,
          sector,
          description,
          volume,
          marketCap
        });
        showToast(`Security ${res.data.symbol} listed successfully`, 'success');
        setStocks([...stocks, res.data].sort((a, b) => a.symbol.localeCompare(b.symbol)));
      }

      // Close modal programmatically by triggering close click
      document.getElementById('closeStockModal').click();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error submitting stock form';
      showToast(msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle trading suspension
  const handleToggleTrading = async (stockId) => {
    try {
      const res = await api.put(`/api/admin/stocks/${stockId}/toggle-trading`);
      showToast(res.data.message, 'success');
      setStocks(stocks.map(s => s._id === stockId ? { ...s, isSuspended: res.data.isSuspended } : s));
    } catch (error) {
      showToast('Failed to toggle stock trading availability', 'danger');
    }
  };

  // Delete Stock Listing
  const handleDeleteStock = async (stockId, symbolStr) => {
    if (!window.confirm(`Are you sure you want to permanently delete stock ${symbolStr} from the simulator database?`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/stocks/${stockId}`);
      showToast(`Stock ${symbolStr} deleted successfully`, 'success');
      setStocks(stocks.filter(s => s._id !== stockId));
    } catch (error) {
      showToast('Error deleting stock listing', 'danger');
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="text-warning fw-bold mb-0">Securities Listing Database</h2>
          <p className="text-muted mb-0">Create new stocks, update profiles, toggle suspensions, or delete entries.</p>
        </div>
        
        {/* Add Button */}
        <button
          type="button"
          className="btn btn-primary-custom d-inline-flex align-items-center gap-2"
          data-bs-toggle="modal"
          data-bs-target="#stockFormModal"
          onClick={handleOpenAdd}
        >
          <i className="bi bi-plus-circle fs-5"></i>
          <span>Add New Stock</span>
        </button>
      </div>

      {/* Stocks Table */}
      <div className="glass-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading stocks listings...</span>
            </div>
          </div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-building-slash fs-3 mb-2 d-block"></i>
            No stocks currently listed on the simulator database.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Details</th>
                  <th>Sector</th>
                  <th className="text-end">Current Price</th>
                  <th className="text-center">Trading Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const isSuspended = stock.isSuspended;
                  return (
                    <tr key={stock._id}>
                      <td className="fw-bold text-white fs-5">{stock.symbol}</td>
                      <td>
                        <div className="fw-semibold text-white">{stock.name}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          Vol: {stock.volume.toLocaleString()} | MC: ${(stock.marketCap / 1e9).toFixed(2)}B
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>
                          {stock.sector}
                        </span>
                      </td>
                      <td className="text-end fw-bold font-monospace text-white">${stock.price.toFixed(2)}</td>
                      <td className="text-center">
                        <span className={`badge ${isSuspended ? 'bg-danger text-uppercase' : 'bg-success text-uppercase'} px-2.5 py-1.5`} style={{ fontSize: '0.7rem' }}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          {/* Toggle Trading */}
                          <button
                            type="button"
                            className={`btn btn-sm ${isSuspended ? 'btn-outline-success' : 'btn-outline-warning'} px-2.5 py-1.5 fw-semibold`}
                            onClick={() => handleToggleTrading(stock._id)}
                          >
                            <i className={`bi ${isSuspended ? 'bi-play-fill' : 'bi-pause-fill'} me-1`}></i>
                            {isSuspended ? 'Allow' : 'Suspend'}
                          </button>
                          
                          {/* Edit Form Button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info px-2.5 py-1.5"
                            data-bs-toggle="modal"
                            data-bs-target="#stockFormModal"
                            onClick={() => handleOpenEdit(stock)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          
                          {/* Delete Action Button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger px-2.5 py-1.5"
                            onClick={() => handleDeleteStock(stock._id, stock.symbol)}
                          >
                            <i className="bi bi-trash3-fill"></i>
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

      {/* Bootstrap Modal Form for Add/Edit Stock */}
      <div className="modal fade" id="stockFormModal" tabIndex="-1" aria-labelledby="stockFormModalLabel" aria-hidden="true" style={{ display: 'none' }}>
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <div className="modal-header border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)' }}>
              <h5 className="modal-title text-white fw-bold" id="stockFormModalLabel">
                {editingStock ? `Edit Stock Listing: ${editingStock.symbol}` : 'Add New Security Listing'}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-toggle="modal" data-bs-target="#stockFormModal" id="closeStockModal" aria-label="Close"></button>
            </div>
            
            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Stock Symbol */}
                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Symbol (e.g. NVDA)*</label>
                    <input
                      type="text"
                      className="form-control form-control-custom text-uppercase fw-bold font-monospace"
                      placeholder="AAPL"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      disabled={!!editingStock} // Cannot change symbol after creation
                      required
                    />
                  </div>

                  {/* Company Name */}
                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Company Name*</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="Apple Inc."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Sector */}
                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Sector*</label>
                    <select
                      className="form-control form-control-custom"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      required
                    >
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Consumer Goods">Consumer Goods</option>
                      <option value="Energy">Energy</option>
                      <option value="Consumer Cyclical">Consumer Cyclical</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Automotive">Automotive</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Listing Price ($)*</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-custom font-monospace"
                      placeholder="180.50"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={!!editingStock} // Cannot change price manually after creation (updates via simulator)
                      required
                    />
                  </div>

                  {/* Volume */}
                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Starting Volume</label>
                    <input
                      type="number"
                      className="form-control form-control-custom font-monospace"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                    />
                  </div>

                  {/* Market Cap */}
                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Market Cap ($)</label>
                    <input
                      type="number"
                      className="form-control form-control-custom font-monospace"
                      value={marketCap}
                      onChange={(e) => setMarketCap(e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Company Description</label>
                    <textarea
                      className="form-control form-control-custom"
                      rows="3"
                      placeholder="Enter business synopsis..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer border-top d-flex justify-content-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
                <button type="button" className="btn btn-outline-light border-0 px-4 py-2 fw-semibold" data-bs-toggle="modal" data-bs-target="#stockFormModal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-custom px-4 py-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <span>{editingStock ? 'Save Changes' : 'List Stock'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStocks;
