import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Bell } from 'lucide-react';
import Logo from './Logo';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav} aria-label="Main navigation">
      <Link to="/" style={styles.brand} aria-label="secondLook home">
        <Logo size="sm" animate={false} style={{ color: 'var(--sl-ink)' }} />
      </Link>

      <div style={styles.actions}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button style={styles.iconBtn} aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div style={styles.userPill}>
              <div style={styles.avatar}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sl-ink)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--sl-text-subtle)' }}>
                  {user.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sl-btn-ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px', color: 'var(--sl-danger)' }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" className="sl-btn-secondary">Sign in</Link>
            <Link to="/register" className="sl-btn-primary">Get started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 28px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--sl-border-light)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'var(--sl-ink)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    color: 'var(--sl-text-muted)',
    background: 'var(--sl-bg-gray-50)',
    border: '1px solid var(--sl-border-light)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px 4px 4px',
    borderRadius: '12px',
    background: 'var(--sl-bg-gray-50)',
    border: '1px solid var(--sl-border-light)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--sl-primary) 0%, #7C3AED 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
};

export default Navbar;
