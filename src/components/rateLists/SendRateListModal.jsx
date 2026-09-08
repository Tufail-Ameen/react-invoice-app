import { useEffect, useState } from "react";

const CHANNELS = [
  { value: "link", label: "Copy link" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

export default function SendRateListModal({
  open,
  onClose,
  onSend,
  sending = false,
  showRotate = false,
}) {
  const [channel, setChannel] = useState("link");
  const [expiresAt, setExpiresAt] = useState("");
  const [rotateToken, setRotateToken] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setChannel("link");
    setExpiresAt("");
    setRotateToken(false);

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    onSend({
      channel,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      rotateToken: showRotate ? rotateToken : false,
    });
  };

  return (
    <div className="rbac-modal-backdrop" onClick={onClose} role="presentation">
      <form
        className="form-card rbac-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className="page-title mb-1" style={{ fontSize: "1.35rem" }}>
          Send rate list
        </h2>
        <p className="textcklr small mb-3">
          Share a client link. WhatsApp and email open on this device with the URL.
        </p>

        <div className="mb-3">
          <span className="form-label input-clr">Channel</span>
          <div className="rate-list-channel-row">
            {CHANNELS.map((option) => (
              <label key={option.value} className="rate-list-channel">
                <input
                  type="radio"
                  name="rate-list-channel"
                  value={option.value}
                  checked={channel === option.value}
                  onChange={() => setChannel(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label input-clr" htmlFor="rate-list-expires">
            Expires (optional)
          </label>
          <input
            id="rate-list-expires"
            type="datetime-local"
            className="form-control input-settings"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        {showRotate && (
          <label className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-primary)]"
              checked={rotateToken}
              onChange={(e) => setRotateToken(e.target.checked)}
            />
            <span className="input-clr">Rotate share token (old link stops working)</span>
          </label>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn cancel py-2 px-3" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn save-changes py-2 px-4" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
