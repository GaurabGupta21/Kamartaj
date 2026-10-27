function StatCard({ label, value, subtext, icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-sub">{subtext}</span>}
        {trend && (
          <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
            {trend}
          </span>
        )}
      </div>
      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
}

export default StatCard;
