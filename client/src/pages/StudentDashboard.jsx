import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { menuAPI, bookingAPI, qrAPI, paymentAPI, getStoredUser } from '../api/api';

function StudentDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [menus, setMenus] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Booking Modal State
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // QR Modal State
  const [qrModal, setQrModal] = useState({ isOpen: false, qrData: '', booking: null, loading: false, error: '' });

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch today's menus
      const menuRes = await menuAPI.getTodayMenus();
      setMenus(menuRes.menus || []);

      // 2. Fetch student's bookings
      const bookingRes = await bookingAPI.getMyBookings();
      setBookings(bookingRes.bookings || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Unable to load today\'s mess information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Book Meal Click
  const handleOpenBookModal = (menu) => {
    setSelectedMenu(menu);
    setQuantity(1);
    setActionMessage({ type: '', text: '' });
  };

  // Submit Meal Booking
  const handleConfirmBooking = async () => {
    if (!selectedMenu) return;

    setBookingLoading(true);
    setActionMessage({ type: '', text: '' });

    try {
      const res = await bookingAPI.createBooking(selectedMenu._id, quantity);
      setActionMessage({
        type: 'success',
        text: `Booking created successfully! Status: Pending Payment (Total: ₹${selectedMenu.price * quantity}). You can complete payment to receive your QR pass.`
      });
      setSelectedMenu(null);
      // Refresh data
      fetchData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to complete meal reservation. Capacity might be full.'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // View QR Pass
  const handleViewQR = async (booking) => {
    setQrModal({ isOpen: true, qrData: '', booking, loading: true, error: '' });
    try {
      const data = await qrAPI.getQR(booking._id);
      setQrModal({
        isOpen: true,
        qrData: data.qr,
        booking,
        loading: false,
        error: ''
      });
    } catch (err) {
      setQrModal({
        isOpen: true,
        qrData: '',
        booking,
        loading: false,
        error: err.message || 'Unable to fetch QR pass. QR passes are only issued after confirmed payment.'
      });
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking and release your reserved seat?')) {
      return;
    }

    try {
      await bookingAPI.cancelBooking(bookingId);
      setActionMessage({ type: 'success', text: 'Booking cancelled successfully. Reserved seat has been released.' });
      fetchData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to cancel booking.' });
    }
  };

  // Filter confirmed upcoming bookings
  const confirmedBookings = bookings.filter(b => b.bookingStatus === 'confirmed');
  const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending_payment');

  return (
    <div>
      {/* Welcome Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome, {user?.name || 'Student'}! 👋
          </h1>
          <p className="page-subtitle">
            📅 {todayFormatted} • Campus Mess Portal
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchData}>
            🔄 Refresh
          </button>
          <Link to="/student/bookings" className="btn btn-outline btn-sm">
            My Bookings ({bookings.length})
          </Link>
        </div>
      </div>

      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-3" style={{ marginBottom: '28px' }}>
        <StatCard
          label="Today's Available Menus"
          value={menus.length}
          subtext="Breakfast, Lunch & Dinner"
          icon="🍲"
        />
        <StatCard
          label="Active Confirmed Passes"
          value={confirmedBookings.length}
          subtext="Ready for meal collection"
          icon="🎫"
        />
        <StatCard
          label="Pending Payments"
          value={pendingBookings.length}
          subtext="Reserved seats awaiting payment"
          icon="⏳"
        />
      </div>

      {/* SECTION: TODAY'S MENUS */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
              Today's Campus Menu
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Reserve your meal slot in advance to assist the refectory in reducing food waste.
            </p>
          </div>
          <Link to="/student/menu" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {loading ? (
          <Loading message="Loading today's fresh menu from refectory..." />
        ) : menus.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No menus published for today yet"
            description="The refectory staff has not yet published meals for today. Please check back shortly."
          />
        ) : (
          <div className="grid grid-cols-3">
            {menus.map((menu) => {
              const remaining = menu.capacity - menu.bookedCount;
              const isFull = remaining <= 0;

              return (
                <div key={menu._id} className="menu-card">
                  <div className="menu-card-top">
                    <span className={`meal-badge meal-${menu.mealType}`}>
                      {menu.mealType}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-dark)' }}>
                      ₹{menu.price}
                    </span>
                  </div>

                  <div className="menu-card-body">
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        ITEMS INCLUDED:
                      </div>
                      <div className="menu-items-list">
                        {menu.items && menu.items.map((item, idx) => (
                          <span key={idx} className="menu-item-tag">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Capacity: <strong>{menu.capacity}</strong>
                      </span>
                      <span style={{ color: isFull ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>
                        {isFull ? 'Sold Out' : `${remaining} spots available`}
                      </span>
                    </div>
                  </div>

                  <div className="menu-card-footer">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-block"
                      disabled={isFull}
                      onClick={() => handleOpenBookModal(menu)}
                    >
                      {isFull ? 'Capacity Reached' : 'Book Meal →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: UPCOMING CONFIRMED BOOKINGS & QR PASSES */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
              Recent Bookings & Passes
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Only verified bookings generate an official refectory QR pass.
            </p>
          </div>
          <Link to="/student/bookings" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
            Full Booking History →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="No meal reservations yet"
            description="When you reserve a meal from the menu above, your booking details and QR meal pass will appear here."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Date</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Booking Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((booking) => {
                  const meal = booking.menu || {};
                  return (
                    <tr key={booking._id}>
                      <td>
                        <strong style={{ textTransform: 'capitalize' }}>
                          {meal.mealType || 'Meal'}
                        </strong>
                      </td>
                      <td>
                        {meal.date ? new Date(meal.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>{booking.quantity}</td>
                      <td>₹{booking.amount}</td>
                      <td>
                        <span className={`badge ${
                          booking.bookingStatus === 'confirmed' ? 'badge-success' :
                          booking.bookingStatus === 'redeemed' ? 'badge-info' :
                          booking.bookingStatus === 'cancelled' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {booking.bookingStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          booking.paymentStatus === 'paid' ? 'badge-success' :
                          booking.paymentStatus === 'failed' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid' && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleViewQR(booking)}
                            >
                              📱 Show QR Pass
                            </button>
                          )}

                          {booking.bookingStatus === 'pending_payment' && (
                            <>
                              <Link
                                to="/student/bookings"
                                className="btn btn-primary btn-sm"
                              >
                                Pay Now
                              </Link>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleCancelBooking(booking._id)}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {booking.bookingStatus === 'redeemed' && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Redeemed on {new Date(booking.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOOKING CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(selectedMenu)}
        onClose={() => setSelectedMenu(null)}
        title={`Book ${selectedMenu?.mealType ? selectedMenu.mealType.toUpperCase() : 'Meal'}`}
      >
        {selectedMenu && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--primary-bg)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '700', color: 'var(--primary-dark)', fontSize: '15px' }}>
                Meal: {selectedMenu.mealType.toUpperCase()}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '4px' }}>
                Items: {selectedMenu.items.join(', ')}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Rate: ₹{selectedMenu.price} per person
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="quantity">
                Number of Portions / Quantity:
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={Math.min(5, selectedMenu.capacity - selectedMenu.bookedCount)}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="form-input"
              />
              <span className="form-hint">
                Max available capacity right now: {selectedMenu.capacity - selectedMenu.bookedCount}
              </span>
            </div>

            <div style={{ margin: '16px 0', padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Total Amount:</span>
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
                {bookingLoading ? 'Reserving...' : 'Confirm Reservation'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR PASS MODAL */}
      <Modal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
        title="Official Refectory QR Pass"
      >
        <div style={{ textAlign: 'center' }}>
          {qrModal.loading ? (
            <Loading message="Generating cryptographic QR pass from backend..." />
          ) : qrModal.error ? (
            <div className="alert alert-error">
              {qrModal.error}
            </div>
          ) : (
            <div className="qr-pass-card">
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--primary)', textTransform: 'uppercase' }}>
                Kamar-Taj Refectory Meal Token
              </div>

              <div className="qr-image-wrapper">
                <img src={qrModal.qrData} alt="Refectory QR Meal Pass" />
              </div>

              <div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)' }}>
                  {qrModal.booking?.menu?.mealType?.toUpperCase()} PASS
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Booking ID: {qrModal.booking?._id}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '4px' }}>
                  Quantity: <strong>{qrModal.booking?.quantity} portion(s)</strong> • ₹{qrModal.booking?.amount}
                </div>
              </div>

              <div className="badge badge-success">
                ● Verified & Ready for Mess Counter Scanning
              </div>
            </div>
          )}

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
            Present this QR code to the mess worker scanner during meal service. Each QR token can be redeemed exactly once.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default StudentDashboard;
