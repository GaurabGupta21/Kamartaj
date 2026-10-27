import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../api/api';

function Navbar({ onToggleSidebar, title, isDashboard = false }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'staff') return '/worker';
    return '/student';
  };

  if (isDashboard) {
    return (
      <header className="top-navbar">
        <div className="top-nav-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
          <h2 className="top-nav-title">{title || 'Dashboard'}</h2>
        </div>

        <div className="top-nav-right">
          <span className="badge badge-success">
            ● System Active
          </span>
          <span className="user-name" style={{ fontSize: '13px' }}>
            {user?.name} ({user?.role === 'staff' ? 'Mess Worker' : user?.role})
          </span>
        </div>
      </header>
    );
  }

  // Public Landing Navbar
  return (
    <header className="top-navbar" style={{ padding: '0 32px' }}>
      <div className="top-nav-left">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon" style={{ width: '36px', height: '36px', fontSize: '18px' }}>
            🏛️
          </div>
          <div>
            <span className="brand-title" style={{ fontSize: '22px' }}>Kamar-Taj</span>
            <span className="brand-sub" style={{ display: 'block', fontSize: '9px' }}>Refectory</span>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-body)' }}>
          Home
        </Link>
        <Link to="/login" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-body)' }}>
          Today's Menu
        </Link>
        {user ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate(getDashboardPath())}
          >
            Go to Dashboard →
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
