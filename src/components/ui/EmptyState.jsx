export default function EmptyState({ title, message }) {
  return (
    <div className="empty-state text-center py-5 px-3">
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message mb-0">{message}</p>
    </div>
  );
}
