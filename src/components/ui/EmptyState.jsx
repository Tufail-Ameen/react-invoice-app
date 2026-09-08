export default function EmptyState({ title, message }) {
  return (
    <div className="empty-state px-3 py-12 text-center">
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message mb-0">{message}</p>
    </div>
  );
}
