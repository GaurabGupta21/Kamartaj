function Loading({ message = "Loading data..." }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}

export default Loading;
