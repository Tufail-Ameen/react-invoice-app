import { delay, http } from "msw";
import { db, nextId } from "../db";
import {
  badRequest,
  conflict,
  guard,
  latency,
  matchesSearch,
  notFound,
  ok,
  paginate,
  url,
} from "../http";

function validateProduct(body, { requireSku = true } = {}) {
  const errors = {};
  if (requireSku && !body.sku?.trim()) errors.sku = ["SKU required."];
  if (!body.name?.trim()) errors.name = ["Name required."];
  if (body.price == null || Number(body.price) < 0) errors.price = ["Price 0 ya zyada."];
  if (body.stock != null && (!Number.isFinite(Number(body.stock)) || Number(body.stock) < 0))
    errors.stock = ["Stock 0 ya zyada integer."];
  return errors;
}

export const productsHandlers = [
  http.get(url("/products"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;

    const params = new URL(request.url).searchParams;
    const q = params.get("q") || params.get("search") || "";
    const status = params.get("status");
    let rows = db.data.products.filter((p) => matchesSearch(p, q, ["name", "sku"]));
    if (status) rows = rows.filter((p) => p.status === status);

    const page = paginate(rows, request, { defaultSort: "name" });
    return ok({ products: page.rows, meta: page.meta });
  }),

  http.get(url("/products/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const product = db.data.products.find((p) => p.id === params.id);
    if (!product) return notFound("Product");
    return ok({ product });
  }),

  http.post(url("/products"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const body = await request.json();
    const errors = validateProduct(body);
    if (Object.keys(errors).length) return badRequest("Fix the errors.", errors);

    const sku = body.sku.trim().toUpperCase();
    if (db.data.products.some((p) => p.sku.toUpperCase() === sku))
      return conflict("Is SKU ka product pehle se hai.");

    const now = new Date().toISOString();
    const stock = Math.floor(Number(body.stock) || 0);
    const product = {
      id: nextId("prd"),
      sku,
      name: body.name.trim(),
      price: Number(body.price),
      stock,
      unit: body.unit?.trim() || "pcs",
      status: body.status === "inactive" ? "inactive" : "active",
      createdAt: now,
      updatedAt: now,
    };
    db.data.products.unshift(product);

    // Opening stock movement — real DB mein same transaction.
    if (stock > 0) {
      db.data.inventoryMovements.unshift({
        id: nextId("mov"),
        productId: product.id,
        type: "opening",
        quantity: stock,
        reason: "Opening stock on create",
        createdBy: auth.user.id,
        createdAt: now,
      });
    }
    db.commit();
    return ok({ product }, 201);
  }),

  http.patch(url("/products/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const product = db.data.products.find((p) => p.id === params.id);
    if (!product) return notFound("Product");

    const body = await request.json();
    // Stock yahan se mat badlo — inventory/adjust use karo (ledger clean rahe).
    const next = {
      sku: body.sku ?? product.sku,
      name: body.name ?? product.name,
      price: body.price ?? product.price,
      unit: body.unit ?? product.unit,
      status: body.status ?? product.status,
    };
    const errors = validateProduct(next);
    if (Object.keys(errors).length) return badRequest("Fix the errors.", errors);

    const sku = String(next.sku).trim().toUpperCase();
    if (db.data.products.some((p) => p.id !== product.id && p.sku.toUpperCase() === sku))
      return conflict("Is SKU ka product pehle se hai.");

    Object.assign(product, {
      sku,
      name: String(next.name).trim(),
      price: Number(next.price),
      unit: String(next.unit || "pcs").trim(),
      status: next.status === "inactive" ? "inactive" : "active",
      updatedAt: new Date().toISOString(),
    });
    db.commit();
    return ok({ product });
  }),

  http.delete(url("/products/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const product = db.data.products.find((p) => p.id === params.id);
    if (!product) return notFound("Product");

    const used = db.data.invoices.some((inv) =>
      (inv.items || []).some((item) => item.productId === product.id)
    );
    if (used) return conflict("Product invoices mein use ho chuka hai — delete nahi.");

    db.data.products = db.data.products.filter((p) => p.id !== product.id);
    db.data.inventoryMovements = db.data.inventoryMovements.filter(
      (m) => m.productId !== product.id
    );
    db.commit();
    return ok({ deleted: true });
  }),
];
