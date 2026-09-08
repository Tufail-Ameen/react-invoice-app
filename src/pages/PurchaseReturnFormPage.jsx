import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Can } from "../auth/guards";
import { PERMISSIONS } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import {
  useCreatePurchaseReturnMutation,
  useGetPurchasesQuery,
  useGetPurchaseReturnableQuery,
} from "../services/invoiceApi";
import { formatAmount } from "../utils/invoice";

export default function PurchaseReturnFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetPurchaseId = searchParams.get("purchaseId") || "";

  const [purchaseId, setPurchaseId] = useState(presetPurchaseId);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [qtyByKey, setQtyByKey] = useState({});

  const { data: purchasesData } = useGetPurchasesQuery({
    status: "CONFIRMED",
    limit: 100,
  });
  const purchases = purchasesData?.purchases || [];

  const {
    data: returnableData,
    isFetching: loadingReturnable,
    isError: returnableError,
    error: returnableErr,
  } = useGetPurchaseReturnableQuery(purchaseId, { skip: !purchaseId });

  const [createPurchaseReturn, { isLoading: saving }] =
    useCreatePurchaseReturnMutation();

  const returnableItems = useMemo(
    () => returnableData?.items || [],
    [returnableData]
  );

  useEffect(() => {
    if (returnableError) {
      toast.error(getErrorMessage(returnableErr, "Failed to load returnable items"));
    }
  }, [returnableError, returnableErr]);

  useEffect(() => {
    if (!returnableItems.length) {
      setQtyByKey({});
      return;
    }
    const next = {};
    returnableItems.forEach((item) => {
      const key = `${item.productId}:${item.variantId ?? "null"}`;
      next[key] = 0;
    });
    setQtyByKey(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId, returnableData]);

  const selectedLines = useMemo(() => {
    return returnableItems
      .map((item) => {
        const key = `${item.productId}:${item.variantId ?? "null"}`;
        const quantity = Number(qtyByKey[key]) || 0;
        return { item, quantity };
      })
      .filter((row) => row.quantity > 0);
  }, [returnableItems, qtyByKey]);

  const previewTotal = useMemo(() => {
    return selectedLines.reduce((sum, { item, quantity }) => {
      return sum + quantity * (Number(item.unitCost) || 0);
    }, 0);
  }, [selectedLines]);

  const save = async (confirm) => {
    if (!purchaseId) {
      toast.error("Select a confirmed purchase");
      return;
    }
    if (!selectedLines.length) {
      toast.error("Enter return quantity for at least one item");
      return;
    }
    for (const { item, quantity } of selectedLines) {
      if (quantity > item.remainingReturnable) {
        toast.error(
          `Qty for ${item.productNameSnapshot || item.productId} exceeds remaining (${item.remainingReturnable})`
        );
        return;
      }
    }

    const payload = {
      purchaseId: Number(purchaseId),
      items: selectedLines.map(({ item, quantity }) => ({
        productId: item.productId,
        ...(item.variantId != null ? { variantId: item.variantId } : {}),
        quantity,
        unitCost: Number(item.unitCost) || 0,
      })),
      reason: reason || undefined,
      notes: notes || undefined,
      ...(confirm ? { confirm: true } : {}),
    };

    try {
      const result = await createPurchaseReturn(payload).unwrap();
      toast.success(
        confirm ? "Purchase return confirmed" : "Draft purchase return saved"
      );
      navigate(`/purchase-returns/${result.purchaseReturn?.id ?? result.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    }
  };

  return (
    <div className="page-wrap">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate("/purchase-returns")}
      >
        <FontAwesomeIcon className="icon me-2" icon={faAngleLeft} size="2xs" />
        Go back
      </button>

      <h1 className="invoice-text mb-3">New Purchase Return</h1>

      <div className="detail-card mb-4">
        <label className="edit-discription mb-1 block">Confirmed Purchase</label>
        <select
          className="form-select input-clr1"
          value={purchaseId}
          onChange={(e) => setPurchaseId(e.target.value)}
        >
          <option value="">Select purchase…</option>
          {purchases.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.purchaseNumber} — {p.supplierName || `Supplier #${p.supplierId}`}
            </option>
          ))}
        </select>

        <div className="mt-3 grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <label className="edit-discription mb-1 block">Reason</label>
            <input
              className="form-control input-clr1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="edit-discription mb-1 block">Notes</label>
            <input
              className="form-control input-clr1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
      </div>

      {!purchaseId ? (
        <p className="textcklr">Select a purchase to load returnable items.</p>
      ) : loadingReturnable ? (
        <p className="textcklr">Loading returnable items…</p>
      ) : !returnableItems.length ? (
        <p className="textcklr">No returnable items on this purchase.</p>
      ) : (
        <div className="table-setting overflow-x-auto">
          <table className="table m-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>Original</th>
                <th>Already Returned</th>
                <th>Remaining</th>
                <th>Unit Cost</th>
                <th>Return Qty</th>
              </tr>
            </thead>
            <tbody>
              {returnableItems.map((item) => {
                const key = `${item.productId}:${item.variantId ?? "null"}`;
                return (
                  <tr key={key}>
                    <td>{item.productNameSnapshot || `Product #${item.productId}`}</td>
                    <td>{item.originalQuantity}</td>
                    <td>{item.alreadyReturned}</td>
                    <td>{item.remainingReturnable}</td>
                    <td>{formatAmount("Rs", item.unitCost)}</td>
                    <td style={{ minWidth: 100 }}>
                      <input
                        type="number"
                        min={0}
                        max={item.remainingReturnable}
                        className="form-control input-clr1"
                        value={qtyByKey[key] ?? 0}
                        disabled={!item.remainingReturnable}
                        onChange={(e) =>
                          setQtyByKey((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </td>
                  </tr>
                );
              })}
              <tr className="total">
                <th colSpan={5} className="py-3">
                  Estimated Total
                </th>
                <th>{formatAmount("Rs", previewTotal)}</th>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="detail-actions mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn input-clr1 edit py-2 px-3"
          disabled={saving}
          onClick={() => save(false)}
        >
          Save Draft
        </button>
        <Can permission={PERMISSIONS.PURCHASE_RETURNS_CONFIRM}>
          <button
            type="button"
            className="btn input-clr1 save py-2 px-3"
            disabled={saving}
            onClick={() => {
              if (
                window.confirm(
                  "Confirm this return now? Stock will decrease and payable will decrease."
                )
              ) {
                save(true);
              }
            }}
          >
            Save & Confirm
          </button>
        </Can>
      </div>
    </div>
  );
}
