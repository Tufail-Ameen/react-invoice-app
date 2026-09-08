import { useState } from "react";
import { toast } from "react-toastify";
import { Select } from "../ui/Input";
import { useAuth } from "../../auth/AuthContext";
import { getErrorMessage } from "../../lib/rtkBaseQuery";

export default function BusinessSwitcher() {
  const { businesses, activeBusiness, switchBusiness, isLoading } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!businesses?.length) return null;

  const onChange = async (event) => {
    const businessId = event.target.value;
    if (!businessId || businessId === activeBusiness?.id) return;
    setBusy(true);
    try {
      await switchBusiness(businessId);
      toast.success("Business switch ho gaya");
    } catch (err) {
      toast.error(getErrorMessage(err, "Business switch fail"));
    } finally {
      setBusy(false);
    }
  };

  if (businesses.length === 1) {
    return (
      <div className="business-switcher business-switcher-static" title={activeBusiness?.name}>
        <span className="business-switcher-label">Business</span>
        <span className="business-switcher-name">{activeBusiness?.name || "—"}</span>
      </div>
    );
  }

  return (
    <div className="business-switcher">
      <label className="business-switcher-label" htmlFor="business-switch">
        Business
      </label>
      <Select
        id="business-switch"
        unstyled
        className="business-switcher-select"
        value={activeBusiness?.id || ""}
        onChange={onChange}
        disabled={busy || isLoading}
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
