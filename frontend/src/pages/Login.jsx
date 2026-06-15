import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/image.png';

const Login = () => {
  const [role, setRole] = useState('user'); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, token, user, logout, showToast } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (token && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [token, user, navigate]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      if (role === 'admin' && result.role !== 'admin') {
        logout('Access denied: Admin privileges required.');
        return;
      }
      if (result.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
          <div className="text-center mb-4">
            <h1 className="fw-extrabold display-5 mb-1 d-flex align-items-center justify-content-center gap-2" style={{ fontFamily: 'Outfit' }}>
              <img src={logo} alt="StockPilot Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ background: 'linear-gradient(to right, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                StockPilot
              </span>
            </h1>
            <p className="text-muted">Virtual Market Simulator & Trading Dashboard</p>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-white mb-3 text-center" style={{ fontFamily: 'Outfit' }}>Sign In</h3>
            
            {/* Role Tab Selector */}
            <div className="d-flex mb-4 p-1.5 rounded-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn w-50 py-2 border-0 fw-bold transition-all ${role === 'user' ? 'btn-primary-custom' : 'text-muted'}`}
                onClick={() => handleRoleChange('user')}
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-person-fill me-1"></i> User Portal
              </button>
              <button
                type="button"
                className={`btn w-50 py-2 border-0 fw-bold transition-all ${role === 'admin' ? 'btn-warning-custom' : 'text-muted'}`}
                onClick={() => handleRoleChange('admin')}
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-shield-lock-fill me-1"></i> Admin Portal
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control form-control-custom"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-semibold">Password</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control form-control-custom pe-5"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y me-3 p-0 border-0"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 10, textDecoration: 'none' }}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} fs-5`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary-custom w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right fs-5"></i>
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-muted small">Don't have an account? </span>
              <Link to="/register" className="small text-decoration-none fw-semibold" style={{ color: 'var(--color-primary)' }}>
                Register Here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
