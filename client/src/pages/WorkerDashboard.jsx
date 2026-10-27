import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { menuAPI, getStoredUser } from '../api/api';

function WorkerDashboard() {
  const user = getStoredUser();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWorkerData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await menuAPI.getTodayMenus();
      setMenus(data.menus || []);
    } catch (err) {
      setError(err.message || 'Unable to load worker menu status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const totalCapacity = menus.reduce((acc, m) => acc + (m.capacity || 0), 0);
  const totalBooked = menus.reduce((acc, m) => acc + (m.bookedCount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Mess Staff Operations Hub 👨‍🍳
          </h1>
          <p className="page-subtitle">
            Welcome, {user?.name}. Manage daily meal capacity, verify student QR passes, and log kitchen food waste.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchWorkerData}>
            🔄 Refresh
          </button>
          <Link to="/worker/scan" className="btn btn-primary btn-sm">
            📷 Open QR Scanner
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Operations Stat Cards */}
      <div className="grid grid-cols-3" style={{ marginBottom: '28px' }}>
        <StatCard
          label="Today's Active Menus"
          value={menus.length}
          subtext="Breakfast, Lunch, Dinner"
          icon="📋"
        />
        <StatCard
          label="Total Meal Reservations"
          value={totalBooked}
          subtext={`Out of ${totalCapacity} maximum capacity`}
          icon="👥"
        />
        <StatCard
          label="Kitchen Workflows"
          value="Ready"
          subtext="QR Scanner & Food Waste Log"
          icon="⚡"
        />
      </div>

      {/* Action Shortcut Tiles */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '14px' }}>
          Quick Operational Tasks
        </h2>

        <div className="grid grid-cols-3">
          <Link to="/worker/menus" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
              Menu & Capacity Management
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Publish new menus, adjust capacity limits, or update dish descriptions for today.
            </p>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginTop: '12px', display: 'inline-block' }}>
              Manage Menus →
            </span>
          </Link>

          <Link to="/worker/scan" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>📷</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
              QR Pass Scanner & Redemption
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Scan student QR passes using camera or enter pass token for instant redemption at meal counters.
            </p>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginTop: '12px', display: 'inline-block' }}>
              Launch Scanner →
            </span>
          </Link>

          <Link to="/worker/waste" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚖️</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
              Food Preparation & Waste Log
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Record kilograms prepared, served, and leftover to feed the smart analytics engine.
            </p>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginTop: '12px', display: 'inline-block' }}>
              Record Wastage →
            </span>
          </Link>
        </div>
      </div>

      {/* TODAY'S SERVICE OVERVIEW */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
            Today's Meal Preparation Schedule
          </h2>
          <Link to="/worker/menus" className="btn btn-secondary btn-sm">
            + Add New Meal
          </Link>
        </div>

        {loading ? (
          <Loading message="Fetching refectory operations schedule..." />
        ) : menus.length === 0 ? (
          <EmptyState
            icon="🍲"
            title="No menus published for today"
            description="Click 'Add New Meal' above to create and publish today's breakfast, lunch, or dinner menu."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Meal Slot</th>
                  <th>Menu Dishes</th>
                  <th>Price</th>
                  <th>Capacity</th>
                  <th>Reserved Portions</th>
                  <th>Occupancy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => {
                  const percent = m.capacity > 0 ? Math.round((m.bookedCount / m.capacity) * 100) : 0;
                  return (
                    <tr key={m._id}>
                      <td>
                        <span className={`meal-badge meal-${m.mealType}`}>
                          {m.mealType}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {m.items && m.items.join(', ')}
                        </div>
                      </td>
                      <td>₹{m.price}</td>
                      <td>{m.capacity} portions</td>
                      <td>
                        <strong>{m.bookedCount}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '6px', background: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, percent)}%`, height: '100%', background: percent > 85 ? 'var(--danger)' : 'var(--primary)' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{percent}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${m.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                          {m.isAvailable ? 'Serving' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkerDashboard;
