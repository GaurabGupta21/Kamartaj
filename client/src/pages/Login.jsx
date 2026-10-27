import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, setAuthData } from '../api/api';

function Login() {
  const navigate = useNavigate();

  const [roleTab, setRoleTab] = useState('student'); // 'student' | 'staff' | 'admin'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await authAPI.login(formData.email, formData.password);
      // Backend returns: { message, token, user: { id, name, email, role } }
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response received from server.');
      }

      setAuthData(data.token, data.user);
      setSuccess(`Welcome back, ${data.user.name}! Redirecting...`);

      // Route according to user role
      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'staff') {
          navigate('/worker');
        } else {
          navigate('/student');
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Top Brand Bar */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon">🏛️</div>
          <div>
            <div className="brand-title">Kamar-Taj</div>
            <div className="brand-sub">Refectory Portal</div>
          </div>
        </Link>
        <Link to="/" className="btn btn-secondary btn-sm">
          ← Back to Home
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '32px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              Sign In to Your Account
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Select your role and enter your campus credentials
            </p>
          </div>

          {/* Role selector tabs */}
          <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn btn-sm ${roleTab === 'student' ? 'btn-primary' : ''}`}
              style={{ flex: 1, border: 'none', background: roleTab === 'student' ? 'var(--primary)' : 'transparent', color: roleTab === 'student' ? '#fff' : 'var(--text-body)' }}
              onClick={() => setRoleTab('student')}
            >
              🎓 Student
            </button>
            <button
              type="button"
              className={`btn btn-sm ${roleTab === 'staff' ? 'btn-primary' : ''}`}
              style={{ flex: 1, border: 'none', background: roleTab === 'staff' ? 'var(--primary)' : 'transparent', color: roleTab === 'staff' ? '#fff' : 'var(--text-body)' }}
              onClick={() => setRoleTab('staff')}
            >
              🍽️ Staff
            </button>
            <button
              type="button"
              className={`btn btn-sm ${roleTab === 'admin' ? 'btn-primary' : ''}`}
              style={{ flex: 1, border: 'none', background: roleTab === 'admin' ? 'var(--primary)' : 'transparent', color: roleTab === 'admin' ? '#fff' : 'var(--text-body)' }}
              onClick={() => setRoleTab('admin')}
            >
              🛡️ Admin
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Campus Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder={roleTab === 'student' ? "student@refectory.edu" : roleTab === 'staff' ? "staff@refectory.edu" : "admin@refectory.edu"}
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : `Sign In as ${roleTab === 'staff' ? 'Mess Worker' : roleTab.charAt(0).toUpperCase() + roleTab.slice(1)}`}
            </button>
          </form>

          {roleTab === 'student' && (
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              Don't have a student account yet?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                Register here
              </Link>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <strong>Note on roles:</strong> Backend permissions are verified securely on each API request. Student registration creates accounts with the <code>student</code> role. Mess Worker (<code>staff</code>) and <code>admin</code> accounts are assigned in MongoDB.
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
