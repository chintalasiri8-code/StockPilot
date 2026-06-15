import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/image.png';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, showToast, token, user } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) return;

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'danger');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name, email, password, role);
    setIsSubmitting(false);

    if (result.success) {
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
            <h3 className="text-white mb-3 text-center" style={{ fontFamily: 'Outfit' }}>Create Account</h3>
            <p className="text-muted text-center small mb-4">Get $10,000 virtual trading balance instantly upon registration!</p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control form-control-custom"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Account Role</label>
                <div className="d-flex p-1.5 rounded-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold transition-all ${role === 'user' ? 'btn-primary-custom' : 'text-muted'}`}
                    onClick={() => setRole('user')}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-person-fill me-1"></i> User
                  </button>
                  <button
                    type="button"
                    className={`btn w-50 py-2 border-0 fw-bold transition-all ${role === 'admin' ? 'btn-warning-custom' : 'text-muted'}`}
                    onClick={() => setRole('admin')}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-shield-lock-fill me-1"></i> Admin
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-semibold">Password</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control form-control-custom pe-5"
                    placeholder="Min. 6 characters"
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
                    <i className="bi bi-person-plus fs-5"></i>
                    <span>Register</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-muted small">Already have an account? </span>
              <Link to="/login" className="small text-decoration-none fw-semibold" style={{ color: 'var(--color-primary)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
