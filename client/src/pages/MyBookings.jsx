import { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { bookingAPI, qrAPI, paymentAPI, getStoredUser } from '../api/api';

function MyBookings() {
  const user = getStoredUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // QR Modal
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    qrData: '',
    booking: null,
    loading: false,
    error: '',
  });

  // Payment processing state
  const [payingBookingId, setPayingBookingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingAPI.getMyBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Show QR Pass for Confirmed Bookings
  const handleShowQR = async (booking) => {
    setQrModal({
      isOpen: true,
      qrData: '',
      booking,
      loading: true,
      error: '',
    });

    try {
      const data = await qrAPI.getQR(booking._id);
      setQrModal({
        isOpen: true,
        qrData: data.qr,
        booking,
        loading: false,
        error: '',
      });
    } catch (err) {
      setQrModal({
        isOpen: true,
        qrData: '',
        booking,
        loading: false,
        error: err.message || 'QR code cannot be loaded. Passes are issued only for paid and confirmed bookings.',
      });
    }
  };

  // Cancel Pending Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking and free up your reserved seat?')) {
      return;
    }

    try {
      await bookingAPI.cancelBooking(bookingId);
      setSuccess('Booking successfully cancelled and seat released.');
      fetchBookings();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking.');
    }
  };

  // Razorpay Payment Handler
  const handlePayNow = async (booking) => {
    setPayingBookingId(booking._id);
    setError('');
    setSuccess('');

    try {
      // 1. Ask backend to create Razorpay Order
      const orderData = await paymentAPI.createOrder(booking._id);

      // Check if Razorpay SDK is available on window
      if (!window.Razorpay) {
        // Dynamically load Razorpay SDK
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Razorpay checkout SDK. Check internet connection.'));
        });
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'The Kamar-Taj Refectory',
        description: `Meal Pass for ${booking.menu?.mealType || 'Meal'}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 3. Send verification payload to backend
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setSuccess('Payment confirmed successfully! Your official QR meal pass is now ready.');
            fetchBookings();
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#15803d',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(resp.error.description || 'Payment was unsuccessful or cancelled.');
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(
        err.message ||
        'Unable to initialize payment. Please ensure your Razorpay API test credentials in the backend are active.'
      );
    } finally {
      setPayingBookingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bookings & QR Meal Passes</h1>
          <p className="page-subtitle">
            Track your reservations, manage pending payments, and display your cryptographic QR passes.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchBookings}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <Loading message="Fetching your meal reservation history..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="No bookings recorded yet"
          description="You haven't reserved any meals yet. Browse today's menu to book your first campus meal."
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Meal Details</th>
                <th>Scheduled Date</th>
                <th>Qty</th>
                <th>Total Price</th>
                <th>Booking Status</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const meal = booking.menu || {};
                const isConfirmedPaid =
                  booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid';
                const isPending = booking.bookingStatus === 'pending_payment';

                return (
                  <tr key={booking._id}>
                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {booking._id.slice(-8).toUpperCase()}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                        {meal.mealType || 'Meal'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {meal.items && Array.isArray(meal.items) ? meal.items.slice(0, 2).join(', ') : 'Campus meal'}
                      </div>
                    </td>
                    <td>
                      {meal.date ? new Date(meal.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <strong>{booking.quantity}</strong>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--primary-dark)' }}>
                        ₹{booking.amount}
                      </strong>
                    </td>
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
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {isConfirmedPaid && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleShowQR(booking)}
                          >
                            📱 Show QR Pass
                          </button>
                        )}

                        {isPending && (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handlePayNow(booking)}
                              disabled={payingBookingId === booking._id}
                            >
                              {payingBookingId === booking._id ? 'Opening...' : '💳 Pay Now'}
                            </button>
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
                          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
                            ✓ Redeemed at counter
                          </span>
                        )}

                        {booking.bookingStatus === 'cancelled' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Cancelled
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

      {/* QR PASS DISPLAY MODAL */}
      <Modal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
        title="Student QR Meal Pass"
      >
        <div style={{ textAlign: 'center' }}>
          {qrModal.loading ? (
            <Loading message="Validating pass with backend and generating QR..." />
          ) : qrModal.error ? (
            <div className="alert alert-error">
              {qrModal.error}
            </div>
          ) : (
            <div className="qr-pass-card">
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--primary)', textTransform: 'uppercase' }}>
                Kamar-Taj Refectory Pass
              </div>

              <div className="qr-image-wrapper">
                <img src={qrModal.qrData} alt="Official QR Token" />
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  {qrModal.booking?.menu?.mealType}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-body)', marginTop: '4px' }}>
                  Student: <strong>{user?.name}</strong>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Portions: {qrModal.booking?.quantity} • Paid ₹{qrModal.booking?.amount}
                </div>
              </div>

              <div className="badge badge-success">
                ● Single-Use Cryptographic Pass
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {qrModal.qrData && (
              <a
                href={qrModal.qrData}
                download={`refectory-pass-${qrModal.booking?._id}.png`}
                className="btn btn-secondary btn-sm"
              >
                📥 Download Pass
              </a>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setQrModal({ ...qrModal, isOpen: false })}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MyBookings;
