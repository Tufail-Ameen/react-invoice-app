import { useEffect, useRef, useState } from "react";

export default function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="filter px-2 py-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="mx-2">{label}</span>
      </button>
      {open && (
        <div className="menuclr absolute right-0 z-20 mt-3 py-2">
          {options.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              className="menuitem block w-full px-4 py-2 text-left text-sm"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
              {value === option.value ? " ✓" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
