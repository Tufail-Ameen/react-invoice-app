import { delay, http } from "msw";
import { db, nextId } from "../db";
import {
  badRequest,
  conflict,
  guard,
  latency,
  notFound,
  ok,
  paginate,
  url,
} from "../http";

export const inventoryHandlers = [
  http.get(url("/inventory/movements"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;

    const params = new URL(request.url).searchParams;
    const productId = params.get("product_id");
    let rows = [...db.data.inventoryMovements];
    if (productId) rows = rows.filter((m) => m.productId === productId);

    const page = paginate(rows, request, { defaultSort: "-createdAt" });
    const enriched = page.rows.map((m) => {
      const product = db.data.products.find((p) => p.id === m.productId);
      return {
        ...m,
        productName: product?.name ?? "—",
        productSku: product?.sku ?? "—",
      };
    });
    return ok({ movements: enriched, meta: page.meta });
  }),

  http.post(url("/inventory/adjust"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const body = await request.json();

    const productId = body.productId;
    const quantity = Number(body.quantity);
    const reason = String(body.reason || "").trim();

    if (!productId) return badRequest("productId required.");
    if (!Number.isInteger(quantity) || quantity === 0)
      return badRequest("quantity non-zero integer hona chahiye.", {
        quantity: ["Non-zero integer required."],
      });
    if (!reason) return badRequest("reason required.", { reason: ["Reason required."] });

    const product = db.data.products.find((p) => p.id === productId);
    if (!product) return notFound("Product");

    const nextStock = product.stock + quantity;
    if (nextStock < 0)
      return conflict(`Stock negative nahi ho sakti (current ${product.stock}).`);

    // Adjust = stock update + append-only ledger row (ek "transaction").
    const now = new Date().toISOString();
    product.stock = nextStock;
    product.updatedAt = now;
    const movement = {
      id: nextId("mov"),
      productId: product.id,
      type: "adjust",
      quantity,
      reason,
      createdBy: auth.user.id,
      createdAt: now,
    };
    db.data.inventoryMovements.unshift(movement);
    db.commit();

    return ok({ product, movement });
  }),
];
