function EmptyState({ icon = "📭", title = "No records found", description, actionButton }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {actionButton && <div style={{ marginTop: '8px' }}>{actionButton}</div>}
    </div>
  );
}

export default EmptyState;
