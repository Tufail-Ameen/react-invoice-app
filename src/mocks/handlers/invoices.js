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

const STATUSES = ["draft", "pending", "paid", "cancelled"];

/** Allowed status transitions — state machine. */
const TRANSITIONS = {
  draft: ["pending", "paid", "cancelled"],
  pending: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

function calcLineTotal(qty, price, tax) {
  const base = (Number(qty) || 0) * (Number(price) || 0);
  return base + base * ((Number(tax) || 0) / 100);
}

function buildItems(rawItems) {
  const errors = {};
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    errors.items = ["Kam az kam 1 line item."];
    return { errors };
  }

  const items = [];
  rawItems.forEach((row, index) => {
    const product = db.data.products.find((p) => p.id === row.productId);
    if (!product) {
      errors[`items.${index}.productId`] = ["Product nahi mila."];
      return;
    }
    const quantity = Number(row.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      errors[`items.${index}.quantity`] = ["Qty >= 1 integer."];
      return;
    }
    const tax = Number(row.tax ?? 0);
    // Server-side price — client price trust mat karo.
    const unitPrice = product.price;
    items.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice,
      tax,
      lineTotal: calcLineTotal(quantity, unitPrice, tax),
    });
  });

  return { items, errors };
}

function serializeInvoice(invoice) {
  const client = db.data.clients.find((c) => c.id === invoice.clientId);
  return {
    ...invoice,
    clientName: client?.name ?? invoice.clientSnapshot?.name ?? "—",
    clientEmail: client?.email ?? invoice.clientSnapshot?.email ?? "",
  };
}

/**
 * Stock deduct / restock — real backend mein SELECT … FOR UPDATE + transaction.
 */
function applyStockDelta(invoice, sign, userId, type) {
  const now = new Date().toISOString();
  for (const item of invoice.items) {
    const product = db.data.products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Product missing: ${item.productId}`);
    const delta = sign * item.quantity;
    const next = product.stock + delta;
    if (next < 0) {
      throw new Error(`Insufficient stock for ${product.name} (have ${product.stock}).`);
    }
    product.stock = next;
    product.updatedAt = now;
    db.data.inventoryMovements.unshift({
      id: nextId("mov"),
      productId: product.id,
      type,
      quantity: delta,
      reason: `Invoice ${invoice.number} (${type})`,
      invoiceId: invoice.id,
      createdBy: userId,
      createdAt: now,
    });
  }
}

function stockAlreadyDeducted(invoice) {
  return invoice.stockDeducted === true;
}

export const invoicesHandlers = [
  http.get(url("/invoices"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;

    const params = new URL(request.url).searchParams;
    const q = params.get("q") || "";
    const status = params.get("status");
    let rows = db.data.invoices.filter((inv) => {
      const client = db.data.clients.find((c) => c.id === inv.clientId);
      return matchesSearch(
        { ...inv, clientName: client?.name },
        q,
        ["number", "clientName", "description"]
      );
    });
    if (status) rows = rows.filter((inv) => inv.status === status);

    const page = paginate(rows, request);
    return ok({ invoices: page.rows.map(serializeInvoice), meta: page.meta });
  }),

  http.get(url("/invoices/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const invoice = db.data.invoices.find((inv) => inv.id === params.id);
    if (!invoice) return notFound("Invoice");
    return ok({ invoice: serializeInvoice(invoice) });
  }),

  http.post(url("/invoices"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const body = await request.json();

    const client = db.data.clients.find((c) => c.id === body.clientId);
    if (!client) return badRequest("Valid clientId required.", { clientId: ["Required."] });

    const status = body.status || "draft";
    if (!STATUSES.includes(status) || status === "cancelled")
      return badRequest("status draft | pending | paid hona chahiye.");

    const { items, errors } = buildItems(body.items);
    if (Object.keys(errors || {}).length) return badRequest("Fix line items.", errors);

    // Pending/paid create par stock check pehle.
    const needsStock = status === "pending" || status === "paid";
    if (needsStock) {
      for (const item of items) {
        const product = db.data.products.find((p) => p.id === item.productId);
        if (!product || product.stock < item.quantity)
          return conflict(
            `${item.name}: stock kam hai (available ${product?.stock ?? 0}).`
          );
      }
    }

    const now = new Date().toISOString();
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const invoice = {
      id: nextId("inv"),
      number: `INV-${String(db.data.invoices.length + 1).padStart(4, "0")}`,
      clientId: client.id,
      clientSnapshot: {
        name: client.name,
        email: client.email,
        address: client.address,
        city: client.city,
        code: client.code,
        country: client.country,
      },
      billFrom: body.billFrom || {
        address: "Ravi Road",
        city: "Lahore",
        code: "54000",
        country: "Pakistan",
      },
      issueDate: body.issueDate || now.slice(0, 10),
      dueDate: body.dueDate || now.slice(0, 10),
      description: body.description || "",
      currency: body.currency || "Rs",
      status,
      items,
      total,
      stockDeducted: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      if (needsStock) {
        applyStockDelta(invoice, -1, auth.user.id, "sale");
        invoice.stockDeducted = true;
      }
    } catch (err) {
      return conflict(err.message);
    }

    db.data.invoices.unshift(invoice);
    db.commit();
    return ok({ invoice: serializeInvoice(invoice) }, 201);
  }),

  http.patch(url("/invoices/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const invoice = db.data.invoices.find((inv) => inv.id === params.id);
    if (!invoice) return notFound("Invoice");
    if (invoice.status !== "draft")
      return conflict("Sirf draft invoices edit ho sakti hain.");

    const body = await request.json();
    if (body.clientId) {
      const client = db.data.clients.find((c) => c.id === body.clientId);
      if (!client) return badRequest("Invalid clientId.");
      invoice.clientId = client.id;
      invoice.clientSnapshot = {
        name: client.name,
        email: client.email,
        address: client.address,
        city: client.city,
        code: client.code,
        country: client.country,
      };
    }

    if (body.items) {
      const { items, errors } = buildItems(body.items);
      if (Object.keys(errors || {}).length) return badRequest("Fix line items.", errors);
      invoice.items = items;
      invoice.total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    }

    if (body.issueDate) invoice.issueDate = body.issueDate;
    if (body.dueDate) invoice.dueDate = body.dueDate;
    if (body.description != null) invoice.description = body.description;
    if (body.currency) invoice.currency = body.currency;
    if (body.billFrom) invoice.billFrom = body.billFrom;
    invoice.updatedAt = new Date().toISOString();
    db.commit();
    return ok({ invoice: serializeInvoice(invoice) });
  }),

  http.patch(url("/invoices/:id/status"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const invoice = db.data.invoices.find((inv) => inv.id === params.id);
    if (!invoice) return notFound("Invoice");

    const { status } = await request.json();
    if (!STATUSES.includes(status)) return badRequest("Invalid status.");

    const allowed = TRANSITIONS[invoice.status] || [];
    if (!allowed.includes(status))
      return conflict(`Cannot go ${invoice.status} → ${status}.`);

    try {
      // draft → pending/paid: deduct stock
      if (
        !stockAlreadyDeducted(invoice) &&
        (status === "pending" || status === "paid")
      ) {
        for (const item of invoice.items) {
          const product = db.data.products.find((p) => p.id === item.productId);
          if (!product || product.stock < item.quantity)
            return conflict(
              `${item.name}: stock kam hai (available ${product?.stock ?? 0}).`
            );
        }
        applyStockDelta(invoice, -1, auth.user.id, "sale");
        invoice.stockDeducted = true;
      }

      // cancel after deduct → restock
      if (status === "cancelled" && stockAlreadyDeducted(invoice)) {
        applyStockDelta(invoice, 1, auth.user.id, "return");
        invoice.stockDeducted = false;
      }
    } catch (err) {
      return conflict(err.message);
    }

    invoice.status = status;
    invoice.updatedAt = new Date().toISOString();
    db.commit();
    return ok({ invoice: serializeInvoice(invoice) });
  }),

  http.delete(url("/invoices/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const invoice = db.data.invoices.find((inv) => inv.id === params.id);
    if (!invoice) return notFound("Invoice");

    if (invoice.status === "paid")
      return conflict("Paid invoice delete nahi — cancel use karo nahi ho sakta after paid.");

    if (stockAlreadyDeducted(invoice)) {
      try {
        applyStockDelta(invoice, 1, auth.user.id, "return");
      } catch (err) {
        return conflict(err.message);
      }
    }

    db.data.invoices = db.data.invoices.filter((inv) => inv.id !== invoice.id);
    db.commit();
    return ok({ deleted: true });
  }),
];
