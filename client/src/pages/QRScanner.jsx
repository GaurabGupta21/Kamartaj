import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { qrAPI } from '../api/api';

function QRScanner() {
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'error' | 'warning', title, message }
  const [recentRedemptions, setRecentRedemptions] = useState([]);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-region';

  // Process QR Token redemption with Backend
  const handleRedeem = async (tokenToRedeem) => {
    const token = tokenToRedeem ? tokenToRedeem.trim() : manualToken.trim();
    if (!token) return;

    setLoading(true);
    setScanResult(null);

    try {
      // Backend POST /api/qr/redeem expects { token }
      const res = await qrAPI.redeemQR(token);

      const successEntry = {
        token: token.slice(0, 10) + '...',
        timestamp: new Date().toLocaleTimeString(),
        message: res.message || 'Meal redeemed successfully',
        status: 'success',
      };

      setScanResult({
        type: 'success',
        title: '✅ Meal Redeemed Successfully!',
        message: `${res.message || 'The student pass is verified and marked as redeemed.'} (Token: ${token.slice(0, 8)}...)`,
      });

      setRecentRedemptions((prev) => [successEntry, ...prev.slice(0, 9)]);
      setManualToken('');
    } catch (err) {
      console.error('Redeem error:', err);
      let type = 'error';
      let title = '❌ Redemption Failed';

      if (err.message && err.message.toLowerCase().includes('already redeemed')) {
        type = 'warning';
        title = '⚠️ Pass Already Redeemed';
      } else if (err.message && err.message.toLowerCase().includes('not verified')) {
        title = '🚫 Payment Not Verified';
      }

      setScanResult({
        type,
        title,
        message: err.message || 'Invalid QR code or booking not eligible for redemption.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Start Camera Scanner
  const startScanner = async () => {
    setCameraError('');
    setScanResult(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Scanned successfully!
          handleRedeem(decodedText);
          // Briefly pause or stop to prevent repeat triggers
          stopScanner();
        },
        (errorMessage) => {
          // Continuous scanning ticks, no need to log every failure
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera start failure:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions in your browser or use the manual token input below.'
      );
      setScanning(false);
    }
  };

  // Stop Camera Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">QR Pass Verification & Redemption</h1>
          <p className="page-subtitle">
            Validate student meal passes at the refectory counter in real-time. Passes are redeemed exactly once.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* Left Column: QR Scanner & Manual Input */}
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h2 className="card-title">Live Camera Scanner</h2>
              <span className={`badge ${scanning ? 'badge-success' : 'badge-neutral'}`}>
                {scanning ? '● Camera Active' : 'Camera Idle'}
              </span>
            </div>

            {/* Video preview area */}
            <div
              id={scannerContainerId}
              style={{
                width: '100%',
                minHeight: '260px',
                background: '#0f172a',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: '#fff',
                position: 'relative',
              }}
            >
              {!scanning && (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                  <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Camera is currently off. Click below to launch the counter scanner.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="alert alert-warning" style={{ marginTop: '12px' }}>
                {cameraError}
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              {!scanning ? (
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={startScanner}
                >
                  ▶ Start Camera Scanner
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={stopScanner}
                >
                  ⏹ Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* Manual Token Verification Box */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '8px' }}>
              Manual Token Entry (Counter Fallback)
            </h3>
            <p className="card-desc" style={{ marginBottom: '16px' }}>
              If a student's phone screen is cracked or the camera is unavailable, enter the 64-character cryptographic token manually.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRedeem(manualToken);
              }}
            >
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste or enter 64-char QR token..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || !manualToken.trim()}
              >
                {loading ? 'Verifying with Backend...' : 'Verify & Redeem Token'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scan Result & Session History */}
        <div>
          {/* Active Result Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 className="card-title" style={{ marginBottom: '16px' }}>
              Verification Status
            </h2>

            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Verifying cryptographic token with MongoDB refectory records...
                </p>
              </div>
            ) : scanResult ? (
              <div
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor:
                    scanResult.type === 'success' ? 'var(--success-bg)' :
                    scanResult.type === 'warning' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                  border: `1px solid ${
                    scanResult.type === 'success' ? '#86efac' :
                    scanResult.type === 'warning' ? '#fde68a' : '#fca5a5'
                  }`,
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color:
                      scanResult.type === 'success' ? '#14532d' :
                      scanResult.type === 'warning' ? '#78350f' : '#7f1d1d',
                    marginBottom: '6px',
                  }}
                >
                  {scanResult.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color:
                      scanResult.type === 'success' ? '#166534' :
                      scanResult.type === 'warning' ? '#92400e' : '#991b1b',
                  }}
                >
                  {scanResult.message}
                </p>

                {scanning === false && scanResult.type === 'success' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '14px' }}
                    onClick={startScanner}
                  >
                    Scan Next Student →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎫</div>
                <p style={{ fontSize: '14px' }}>
                  Awaiting pass scan. Scanned results and cryptographic verification status will appear here immediately.
                </p>
              </div>
            )}
          </div>

          {/* Session Redemption Log */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '12px' }}>
              Redemptions This Counter Session ({recentRedemptions.length})
            </h3>

            {recentRedemptions.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                No passes redeemed during this active browser session yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentRedemptions.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-muted)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                    }}
                  >
                    <div>
                      <span className="badge badge-success" style={{ marginRight: '8px' }}>
                        Redeemed
                      </span>
                      <span>Token: <code>{item.token}</code></span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRScanner;
