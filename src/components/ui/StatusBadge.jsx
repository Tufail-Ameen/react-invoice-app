import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const STATUS_MAP = {
  1: { label: "Draft", className: "draftbtn" },
  2: { label: "Pending", className: "pendingbtn" },
  3: { label: "Paid", className: "paidbtn" },
};

export default function StatusBadge({ status, compact = false }) {
  const config = STATUS_MAP[status] || STATUS_MAP[3];

  return (
    <button
      type="button"
      className={`btn ${config.className} ${compact ? "px-3 py-1" : "px-4"}`}
      style={compact ? { fontSize: "12px" } : undefined}
    >
      <span className="me-1">
        <FontAwesomeIcon icon={faCircle} size="2xs" />
      </span>
      <label className={status === 2 ? "pending" : undefined}>{config.label}</label>
    </button>
  );
}
