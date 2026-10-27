import { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { menuAPI, bookingAPI } from '../api/api';

function Menu() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Booking Modal
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await menuAPI.getTodayMenus();
      setMenus(data.menus || []);
    } catch (err) {
      setError(err.message || 'Unable to fetch menus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const filteredMenus = menus.filter((menu) => {
    if (filter === 'all') return true;
    return menu.mealType === filter;
  });

  const handleOpenBookModal = (menu) => {
    setSelectedMenu(menu);
    setQuantity(1);
    setSuccess('');
    setError('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedMenu) return;
    setBookingLoading(true);
    setError('');
    setSuccess('');

    try {
      await bookingAPI.createBooking(selectedMenu._id, quantity);
      setSuccess(`Meal booking reserved! Check "My Bookings" to complete payment and get your QR code.`);
      setSelectedMenu(null);
      fetchMenus();
    } catch (err) {
      setError(err.message || 'Failed to book meal.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Campus Menu</h1>
          <p className="page-subtitle">
            View what is being cooked today at The Kamar-Taj Refectory and secure your plate.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-muted)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {['all', 'breakfast', 'lunch', 'dinner'].map((type) => (
            <button
              key={type}
              type="button"
              className={`btn btn-sm ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                textTransform: 'capitalize',
                background: filter === type ? 'var(--primary)' : 'transparent',
                color: filter === type ? '#fff' : 'var(--text-body)',
                border: 'none',
              }}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <Loading message="Loading menu items from refectory..." />
      ) : filteredMenus.length === 0 ? (
        <EmptyState
          icon="🍲"
          title={`No ${filter === 'all' ? '' : filter} menu available today`}
          description="Check back later or check with the mess worker desk."
        />
      ) : (
        <div className="grid grid-cols-3">
          {filteredMenus.map((menu) => {
            const availableSeats = menu.capacity - menu.bookedCount;
            const isFull = availableSeats <= 0;

            return (
              <div key={menu._id} className="menu-card">
                <div className="menu-card-top">
                  <span className={`meal-badge meal-${menu.mealType}`}>
                    {menu.mealType}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-dark)' }}>
                    ₹{menu.price}
                  </span>
                </div>

                <div className="menu-card-body">
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    DISHES PREPARED TODAY:
                  </div>
                  <div className="menu-items-list" style={{ minHeight: '60px' }}>
                    {menu.items && menu.items.map((item, idx) => (
                      <span key={idx} className="menu-item-tag">
                        ✓ {item}
                      </span>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Capacity limit:</span>
                      <strong>{menu.capacity} seats</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Booked:</span>
                      <strong style={{ color: isFull ? 'var(--danger)' : 'var(--success)' }}>
                        {menu.bookedCount} / {menu.capacity} {isFull ? '(FULL)' : ''}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="menu-card-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={isFull}
                    onClick={() => handleOpenBookModal(menu)}
                  >
                    {isFull ? 'Sold Out' : 'Reserve Meal Spot'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking confirmation modal */}
      <Modal
        isOpen={Boolean(selectedMenu)}
        onClose={() => setSelectedMenu(null)}
        title={`Book Meal - ${selectedMenu?.mealType?.toUpperCase()}`}
      >
        {selectedMenu && (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-body)', marginBottom: '16px' }}>
              Confirm your reservation for today's <strong>{selectedMenu.mealType}</strong>.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="portions">Portions:</label>
              <input
                id="portions"
                type="number"
                min="1"
                max={selectedMenu.capacity - selectedMenu.bookedCount}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="form-input"
              />
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--primary-bg)', borderRadius: 'var(--radius-md)', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Total Price to Pay:</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-dark)' }}>
                ₹{selectedMenu.price * quantity}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedMenu(null)}
                disabled={bookingLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Reserving...' : 'Confirm & Reserve'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Menu;
