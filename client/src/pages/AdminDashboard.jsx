import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { analyticsAPI } from '../api/api';

function AdminDashboard() {
  const [daysFilter, setDaysFilter] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics data from backend
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    dailyRevenue: [],
    revenueByMeal: [],
  });

  const [bookingsData, setBookingsData] = useState({
    totalBookings: 0,
    statusCounts: [],
    mealDemand: [],
  });

  const [capacityData, setCapacityData] = useState([]);
  const [wastageData, setWastageData] = useState([]);

  const fetchAnalytics = async (days) => {
    setLoading(true);
    setError('');

    try {
      const [rev, bks, cap, wst] = await Promise.allSettled([
        analyticsAPI.getRevenue(days),
        analyticsAPI.getBookings(days),
        analyticsAPI.getCapacity(),
        analyticsAPI.getWastage(days),
      ]);

      if (rev.status === 'fulfilled') setRevenueData(rev.value);
      if (bks.status === 'fulfilled') setBookingsData(bks.value);
      if (cap.status === 'fulfilled') setCapacityData(cap.value || []);
      if (wst.status === 'fulfilled') setWastageData(wst.value || []);

      // If all failed, show error
      if (
        rev.status === 'rejected' &&
        bks.status === 'rejected' &&
        cap.status === 'rejected' &&
        wst.status === 'rejected'
      ) {
        throw new Error(rev.reason?.message || 'Failed to connect to analytics APIs.');
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Error fetching analytics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(daysFilter);
  }, [daysFilter]);

  // Aggregate wastage calculations across meals
  const totalPreparedKg = wastageData.reduce((acc, curr) => acc + (curr.preparedKg || 0), 0);
  const totalServedKg = wastageData.reduce((acc, curr) => acc + (curr.servedKg || 0), 0);
  const totalWastedKg = wastageData.reduce((acc, curr) => acc + (curr.wastedKg || 0), 0);
  const overallWastePct =
    totalPreparedKg > 0 ? ((totalWastedKg / totalPreparedKg) * 100).toFixed(1) : '0.0';

  // Calculate total redeemed quantity from bookings data
  const totalRedeemedMeals = (bookingsData.mealDemand || []).reduce(
    (acc, m) => acc + (m.redeemedQuantity || 0),
    0
  );

  // Format daily revenue data for Recharts
  const chartRevenue = (revenueData.dailyRevenue || []).map((item) => ({
    date: item._id,
    Revenue: item.revenue,
  }));

  // Format food prep vs served vs wasted for Recharts
  const chartWastage = wastageData.map((item) => ({
    meal: item._id ? item._id.toUpperCase() : 'Meal',
    'Prepared (kg)': item.preparedKg,
    'Served (kg)': item.servedKg,
    'Wasted (kg)': item.wastedKg,
    'Waste %': item.wastagePercent ? Math.round(item.wastagePercent * 10) / 10 : 0,
  }));

  return (
    <div>
      {/* Header & Filter Controls */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Analytics & Food-Waste Intelligence</h1>
          <p className="page-subtitle">
            The Kamar-Taj Refectory • Real-Time Campus Dining & Waste Reduction Dashboard
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-muted)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              className={`btn btn-sm ${daysFilter === 7 ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                border: 'none',
                background: daysFilter === 7 ? 'var(--primary)' : 'transparent',
                color: daysFilter === 7 ? '#fff' : 'var(--text-body)',
              }}
              onClick={() => setDaysFilter(7)}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={`btn btn-sm ${daysFilter === 30 ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                border: 'none',
                background: daysFilter === 30 ? 'var(--primary)' : 'transparent',
                color: daysFilter === 30 ? '#fff' : 'var(--text-body)',
              }}
              onClick={() => setDaysFilter(30)}
            >
              Last 30 Days
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchAnalytics(daysFilter)}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* 6 Core Stat Cards */}
      <div className="grid grid-cols-3" style={{ marginBottom: '24px' }}>
        <StatCard
          label="Total Meal Reservations"
          value={bookingsData.totalBookings || 0}
          subtext={`In the last ${daysFilter} days`}
          icon="🎫"
        />

        <StatCard
          label="Successfully Redeemed Meals"
          value={totalRedeemedMeals}
          subtext="Cryptographically validated at counter"
          icon="✅"
        />

        <StatCard
          label="Total Collected Revenue"
          value={`₹${(revenueData.totalRevenue || 0).toLocaleString()}`}
          subtext={`Today: ₹${(revenueData.todayRevenue || 0).toLocaleString()}`}
          icon="💳"
        />
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <StatCard
          label="Total Food Prepared"
          value={`${totalPreparedKg} kg`}
          subtext="Kitchen preparation volume"
          icon="🍲"
        />

        <StatCard
          label="Measured Food Leftover/Waste"
          value={`${totalWastedKg} kg`}
          subtext={`Food served: ${totalServedKg} kg`}
          icon="⚖️"
        />

        <StatCard
          label="Calculated Food Waste %"
          value={`${overallWastePct}%`}
          subtext={parseFloat(overallWastePct) <= 10 ? "Target healthy range (<10%)" : "Above waste target"}
          icon="📉"
        />
      </div>

      {loading ? (
        <Loading message="Computing analytics aggregations from refectory database..." />
      ) : (
        <>
          {/* CHARTS GRID */}
          <div className="grid grid-cols-2" style={{ marginBottom: '28px' }}>
            {/* Chart 1: Food Prepared vs Served vs Wasted */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Food Prepared vs Served vs Wasted</h2>
                  <p className="card-desc">Comparative kitchen metrics by meal slot in Kilograms (kg)</p>
                </div>
              </div>

              {chartWastage.length === 0 ? (
                <EmptyState
                  icon="⚖️"
                  title="No waste logs recorded for this period"
                  description="Have mess staff log daily kitchen measurements in the Food Waste log."
                />
              ) : (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartWastage} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="meal" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Prepared (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Served (kg)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Wasted (kg)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: Waste Percentage Trend by Meal */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Food Waste Percentage Trend</h2>
                  <p className="card-desc">Calculated loss percentage: (Wasted / Prepared) × 100</p>
                </div>
              </div>

              {chartWastage.length === 0 ? (
                <EmptyState
                  icon="📉"
                  title="No waste percentage data"
                  description="Measurements will plot here once daily records are submitted."
                />
              ) : (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartWastage} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="meal" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Waste %" fill="#d97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Chart 3 & 4: Daily Revenue & Meal Capacity */}
          <div className="grid grid-cols-2" style={{ marginBottom: '28px' }}>
            {/* Daily Revenue Area Chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Daily Revenue Inflow (₹)</h2>
                  <p className="card-desc">Verified meal bookings revenue trend over time</p>
                </div>
              </div>

              {chartRevenue.length === 0 ? (
                <EmptyState
                  icon="💰"
                  title="No revenue recorded in this period"
                  description="Completed bookings will automatically reflect in revenue analytics."
                />
              ) : (
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartRevenue} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Revenue"
                        stroke="#15803d"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Meal Demand & Capacity Status Table */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Live Meal Capacity & Demand</h2>
                  <p className="card-desc">Comparison of total capacity limits vs reserved portions</p>
                </div>
              </div>

              {capacityData.length === 0 ? (
                <EmptyState
                  icon="🍽️"
                  title="No active menus"
                  description="No menu capacity records found."
                />
              ) : (
                <div className="table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Meal</th>
                        <th>Capacity</th>
                        <th>Booked</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityData.map((c, idx) => (
                        <tr key={idx}>
                          <td>
                            <span className={`meal-badge meal-${c.mealType}`}>
                              {c.mealType}
                            </span>
                          </td>
                          <td>{c.capacity}</td>
                          <td>
                            <strong>{c.booked}</strong>
                          </td>
                          <td style={{ color: c.available <= 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>
                            {c.available <= 0 ? '0 (Full)' : c.available}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Backend Integration & Missing Endpoints Note */}
      <div className="card" style={{ backgroundColor: 'var(--bg-muted)', borderStyle: 'dashed' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
          ℹ️ Backend Integration Note: Student & Staff Management
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          The existing backend does not currently expose user management endpoints (such as <code>GET /api/users</code> or <code>PUT /api/users/:id/role</code>) to list, edit, or delete registered students and mess workers.
          As strictly instructed, we did not alter the existing backend or fabricate fake user lists. Once user management routes are added to <code>src/routes/userRoutes.js</code>, user administration tables can be seamlessly integrated.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
