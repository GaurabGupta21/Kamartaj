import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuthData } from '../api/api';

function Sidebar({ user, isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const role = user?.role || 'student';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon">🏛️</div>
            <div>
              <div className="brand-title">Kamar-Taj</div>
              <div className="brand-sub">Refectory</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* STUDENT ROUTES */}
          {role === 'student' && (
            <>
              <div className="nav-section-title">Student Portal</div>
              <NavLink
                to="/student"
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📊</span> Dashboard
              </NavLink>

              <NavLink
                to="/student/menu"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">🍲</span> Today's Menu
              </NavLink>

              <NavLink
                to="/student/bookings"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">🎫</span> My Bookings & QR
              </NavLink>
            </>
          )}

          {/* STAFF / MESS WORKER ROUTES */}
          {(role === 'staff' || role === 'admin') && (
            <>
              <div className="nav-section-title">Mess Worker</div>
              <NavLink
                to="/worker"
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">👷</span> Worker Hub
              </NavLink>

              <NavLink
                to="/worker/menus"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📋</span> Menu Management
              </NavLink>

              <NavLink
                to="/worker/scan"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📷</span> QR Scanner
              </NavLink>

              <NavLink
                to="/worker/waste"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">⚖️</span> Food Waste Log
              </NavLink>
            </>
          )}

          {/* ADMIN ROUTES */}
          {role === 'admin' && (
            <>
              <div className="nav-section-title">Administration</div>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📈</span> Executive Analytics
              </NavLink>

              <NavLink
                to="/admin/capacity"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">🍽️</span> Meal Capacity
              </NavLink>

              <NavLink
                to="/admin/waste-reports"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">📉</span> Waste Analytics
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-snippet">
            <div className="user-avatar">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Guest User'}</span>
              <span className="user-role-badge">
                {role === 'staff' ? 'Mess Worker' : role}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm btn-block"
            onClick={handleLogout}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
