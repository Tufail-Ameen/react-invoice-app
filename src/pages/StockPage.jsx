import EmptyState from "../components/ui/EmptyState";

export default function StockPage() {
  return (
    <div className="page-wrap">
      <h1 className="page-title mb-4">Stock Management</h1>
      <EmptyState
        title="No stock items yet"
        message="Stock tracking will appear here once items are added."
      />
    </div>
  );
}
