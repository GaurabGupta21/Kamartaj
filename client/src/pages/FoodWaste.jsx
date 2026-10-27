import { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { analyticsAPI, getStoredUser } from '../api/api';

function FoodWaste() {
  const user = getStoredUser();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch',
    preparedKg: '',
    servedKg: '',
    wastedKg: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      // Backend GET /api/admin/analytics/wastage?days=30
      const data = await analyticsAPI.getWastage(30);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Wastage fetch notice:', err.message);
      // In the backend, analytics routes require admin role. If logged in as staff, notify respectfully
      if (err.status === 403) {
        setError(
          'Note: The backend route `/api/admin/analytics/wastage` is currently configured for the "admin" role. If logged in as Staff, view permissions require admin privilege or route allowance.'
        );
      } else {
        setError(err.message || 'Unable to fetch historical waste records.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const prep = parseFloat(formData.preparedKg);
    const served = parseFloat(formData.servedKg);
    const wasted = parseFloat(formData.wastedKg);

    if (isNaN(prep) || isNaN(served) || isNaN(wasted) || prep < 0 || served < 0 || wasted < 0) {
      setError('Quantities must be positive numbers (in Kilograms).');
      return;
    }

    if (served + wasted > prep) {
      setError(`Logical mismatch: Served (${served} kg) + Leftover/Wasted (${wasted} kg) exceeds Prepared (${prep} kg).`);
      return;
    }

    setSubmitting(true);
    try {
      await analyticsAPI.addWastage({
        date: formData.date,
        mealType: formData.mealType,
        preparedKg: prep,
        servedKg: served,
        wastedKg: wasted,
      });

      setSuccess('Food preparation and waste log successfully recorded in refectory database!');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mealType: 'lunch',
        preparedKg: '',
        servedKg: '',
        wastedKg: '',
      });
      fetchRecords();
    } catch (err) {
      if (err.status === 403) {
        setError(
          'Backend Permission Note: The existing backend file `analyticsRoutes.js` currently requires `allowRoles("admin")` on `/api/admin/analytics/wastage`. To allow mess staff to post records directly, add "staff" to `allowRoles("admin", "staff")` in the backend.'
        );
      } else {
        setError(err.message || 'Failed to record food waste entry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitchen Food Preparation & Waste Tracking</h1>
          <p className="page-subtitle">
            Log meal quantities prepared, served, and discarded to enable intelligent analytics and minimize food loss.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid grid-cols-2">
        {/* Entry Form */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '6px' }}>
            Daily Kitchen Measurement Entry
          </h2>
          <p className="card-desc" style={{ marginBottom: '20px' }}>
            Enter physical measurements recorded at the end of each meal service. All metrics are tracked in <strong>Kilograms (kg)</strong>.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="date">Service Date:</label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  className="form-input"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mealType">Meal Service:</label>
                <select
                  id="mealType"
                  name="mealType"
                  className="form-select"
                  value={formData.mealType}
                  onChange={handleChange}
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="preparedKg">
                1. Total Food Prepared (kg):
              </label>
              <input
                id="preparedKg"
                type="number"
                step="0.1"
                min="0"
                name="preparedKg"
                className="form-input"
                placeholder="e.g. 150.0"
                value={formData.preparedKg}
                onChange={handleChange}
                required
              />
              <span className="form-hint">Total batch weight cooked for this meal session.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="servedKg">
                2. Total Food Served to Students (kg):
              </label>
              <input
                id="servedKg"
                type="number"
                step="0.1"
                min="0"
                name="servedKg"
                className="form-input"
                placeholder="e.g. 132.5"
                value={formData.servedKg}
                onChange={handleChange}
                required
              />
              <span className="form-hint">Portions actually dispensed at meal counters.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="wastedKg">
                3. Measured Leftover / Discarded Waste (kg):
              </label>
              <input
                id="wastedKg"
                type="number"
                step="0.1"
                min="0"
                name="wastedKg"
                className="form-input"
                placeholder="e.g. 17.5"
                value={formData.wastedKg}
                onChange={handleChange}
                required
              />
              <span className="form-hint">Leftover food unconsumed or discarded after service.</span>
            </div>

            {/* Quick Live Calculation */}
            {parseFloat(formData.preparedKg) > 0 && parseFloat(formData.wastedKg) >= 0 && (
              <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Calculated Waste Percentage:</span>
                  <strong style={{ color: ((parseFloat(formData.wastedKg) / parseFloat(formData.preparedKg)) * 100) > 15 ? 'var(--danger)' : 'var(--primary)' }}>
                    {((parseFloat(formData.wastedKg) / parseFloat(formData.preparedKg)) * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? 'Submitting to Backend...' : '💾 Save Kitchen Record'}
            </button>
          </form>
        </div>

        {/* Existing Records / Historical Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Meal Wastage Aggregates</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchRecords}>
              🔄 Refresh
            </button>
          </div>

          <p className="card-desc" style={{ marginBottom: '16px' }}>
            Aggregated wastage statistics grouped by meal type from MongoDB.
          </p>

          {loading ? (
            <Loading message="Fetching waste logs..." />
          ) : records.length === 0 ? (
            <EmptyState
              icon="⚖️"
              title="No wastage records found"
              description="Records submitted by the kitchen staff will appear here."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Meal Service</th>
                    <th>Prepared</th>
                    <th>Served</th>
                    <th>Wasted</th>
                    <th>Loss %</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => {
                    const pct = rec.wastagePercent !== undefined ? Math.round(rec.wastagePercent * 10) / 10 : 0;
                    return (
                      <tr key={rec._id}>
                        <td>
                          <span className={`meal-badge meal-${rec._id}`}>
                            {rec._id}
                          </span>
                        </td>
                        <td>{rec.preparedKg} kg</td>
                        <td>{rec.servedKg} kg</td>
                        <td>
                          <strong style={{ color: 'var(--danger)' }}>
                            {rec.wastedKg} kg
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${pct > 15 ? 'badge-danger' : 'badge-success'}`}>
                            {pct}%
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
    </div>
  );
}

export default FoodWaste;
