import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password, role);
      if (data.user.role === 'recruiter') {
        navigate('/recruiter');
      } else {
        navigate('/candidate');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card sl-card">
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="auth-logo">
          <Logo size="sm" animate={false} style={{ color: 'var(--sl-ink)' }} />
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-role-toggle">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`auth-role-btn ${role === 'candidate' ? 'active' : ''}`}
            >
              👤 Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`auth-role-btn ${role === 'recruiter' ? 'active' : ''}`}
            >
              🏢 Recruiter
            </button>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'candidate' ? 'candidate@example.com' : 'recruiter@company.com'}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-eye-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="sl-btn-primary auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {role === 'recruiter' && (
          <div className="auth-demo-hint">
            <strong>Demo:</strong> recruiter@techcorp.com / password123
          </div>
        )}
        {role === 'candidate' && (
          <div className="auth-demo-hint">
            <strong>Demo:</strong> candidate@gmail.com / password123
          </div>
        )}

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create an account</Link>
        </p>
      </div>

      <style>{authStyles}</style>
    </div>
  );
}

const authStyles = `
  .auth-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #EFF6FF 0%, #F0F4FA 50%, #EDE9FE 100%);
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    padding: 32px;
    animation: fadeRiseIn 500ms ease-out both;
  }

  @keyframes fadeRiseIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .auth-back-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--sl-text-muted);
    text-decoration: none;
    margin-bottom: 24px;
    transition: color 150ms ease;
  }

  .auth-back-link:hover { color: var(--sl-ink); }

  .auth-logo { margin-bottom: 24px; }

  .auth-title {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--sl-ink);
    margin-bottom: 4px;
  }

  .auth-subtitle {
    color: var(--sl-text-muted);
    font-size: 0.875rem;
    margin-bottom: 20px;
  }

  .auth-error {
    background: var(--sl-danger-light);
    color: var(--sl-danger-text);
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 0.85rem;
    margin-bottom: 16px;
    text-align: center;
    border: 1px solid rgba(220, 38, 38, 0.15);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .auth-role-toggle {
    display: flex;
    gap: 8px;
    background: var(--sl-bg-gray-50);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid var(--sl-border-light);
  }

  .auth-role-btn {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--sl-text-muted);
    background: transparent;
    cursor: pointer;
    transition: all 150ms ease;
    border: none;
  }

  .auth-role-btn.active {
    background: var(--sl-bg-white);
    color: var(--sl-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .auth-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--sl-ink);
  }

  .auth-password-wrap { position: relative; }

  .auth-eye-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--sl-text-subtle);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    background: none;
    border: none;
  }

  .auth-eye-btn:hover { color: var(--sl-ink); }

  .auth-submit {
    width: 100%;
    padding: 12px;
    margin-top: 4px;
    font-size: 0.95rem;
  }

  .auth-demo-hint {
    margin-top: 16px;
    padding: 10px 14px;
    background: var(--sl-info-light);
    color: var(--sl-info);
    border-radius: 10px;
    font-size: 0.8rem;
    text-align: center;
  }

  .auth-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 0.85rem;
    color: var(--sl-text-muted);
  }
`;

export default Login;
