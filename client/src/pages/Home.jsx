import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getStoredUser } from '../api/api';

function Home() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleGetStarted = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'staff') {
      navigate('/worker');
    } else {
      navigate('/student');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '48px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '40px 16px 56px 16px' }}>
          <span className="badge badge-success" style={{ marginBottom: '16px', fontSize: '13px', padding: '6px 14px' }}>
            Smart Campus Mess & Food-Waste Analytics
          </span>

          <h1 style={{ fontSize: '46px', fontWeight: '900', color: 'var(--primary-dark)', lineHeight: '1.15', letterSpacing: '-0.03em', maxWidth: '850px', margin: '0 auto' }}>
            The Kamar-Taj Refectory
          </h1>

          <p style={{ fontSize: '20px', color: 'var(--text-body)', marginTop: '16px', maxWidth: '680px', margin: '16px auto 0 auto', lineHeight: '1.5' }}>
            Nutritious campus meals, zero waste. Reserve your daily meals in advance, redeem with secure cryptographic QR passes, and empower data-driven food conservation.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleGetStarted}
            >
              {user ? 'Enter Your Dashboard →' : 'Sign In to Mess Portal →'}
            </button>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Explore Today's Menu
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-3" style={{ marginBottom: '60px' }}>
          <div className="card">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍲</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              Daily Menus & Advance Booking
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Check breakfast, lunch, and dinner options each morning. Advance meal bookings allow refectory chefs to prepare exact portions rather than overproducing.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📱</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              Secure QR Meal Passes
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Verified bookings generate single-use cryptographic QR tokens. Mess workers scan passes instantly at serving counters, eliminating queues and duplicate claims.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              Intelligent Waste Analytics
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Detailed tracking of food prepared, served, and leftover (in kg). Executive charts track waste percentages and demand patterns to drive sustainable campus dining.
            </p>
          </div>
        </div>

        {/* Roles section */}
        <div className="card" style={{ padding: '36px', backgroundColor: '#fff', border: '1px solid var(--primary-border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              Tailored Portals for the Entire Campus Community
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Each role enjoys dedicated workflows connected to real backend services.
            </p>
          </div>

          <div className="grid grid-cols-3">
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓</div>
              <h4 style={{ fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '6px' }}>
                Students
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                View today's dishes, reserve meal slots, cancel unneeded reservations, and display official QR passes on your mobile phone.
              </p>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍽️</div>
              <h4 style={{ fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '6px' }}>
                Mess Workers & Staff
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Publish daily menus, update seat capacity, scan student QR passes with webcam, and log physical kitchen preparation/leftover weights.
              </p>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
              <h4 style={{ fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '6px' }}>
                Administration
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Review real-time revenue trends, redemption ratios, capacity occupancy, and food waste reduction metrics with interactive Recharts.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: '#fff', padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        <p>
          The Kamar-Taj Refectory — Secure Smart Mess Management & Food-Waste Analytics
        </p>
      </footer>
    </div>
  );
}

export default Home;
