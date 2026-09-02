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

function validateClient(body) {
  const errors = {};
  if (!body.name?.trim() || body.name.trim().length < 3)
    errors.name = ["Name kam az kam 3 characters."];
  if (!/^\S+@\S+\.\S+$/.test(body.email ?? "")) errors.email = ["Valid email required."];
  if (!body.address?.trim()) errors.address = ["Address required."];
  if (!body.city?.trim()) errors.city = ["City required."];
  if (!/^\d{5}$/.test(String(body.code ?? ""))) errors.code = ["Postcode 5 digits."];
  if (!body.country?.trim()) errors.country = ["Country required."];
  return errors;
}

export const clientsHandlers = [
  http.get(url("/clients"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;

    const params = new URL(request.url).searchParams;
    const q = params.get("q") || params.get("search") || "";
    let rows = db.data.clients.filter((c) =>
      matchesSearch(c, q, ["name", "email", "city", "country"])
    );
    const page = paginate(rows, request);
    return ok({ clients: page.rows, meta: page.meta });
  }),

  http.get(url("/clients/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const client = db.data.clients.find((c) => c.id === params.id);
    if (!client) return notFound("Client");
    return ok({ client });
  }),

  http.post(url("/clients"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const body = await request.json();
    const errors = validateClient(body);
    if (Object.keys(errors).length) return badRequest("Fix the errors.", errors);

    const email = body.email.toLowerCase().trim();
    if (db.data.clients.some((c) => c.email.toLowerCase() === email))
      return conflict("Is email ka client pehle se hai.");

    const now = new Date().toISOString();
    const client = {
      id: nextId("cli"),
      name: body.name.trim(),
      email,
      address: body.address.trim(),
      city: body.city.trim(),
      code: String(body.code),
      country: body.country.trim(),
      createdAt: now,
      updatedAt: now,
    };
    db.data.clients.unshift(client);
    db.commit();
    return ok({ client }, 201);
  }),

  http.patch(url("/clients/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const client = db.data.clients.find((c) => c.id === params.id);
    if (!client) return notFound("Client");

    const body = await request.json();
    const next = { ...client, ...body, id: client.id };
    const errors = validateClient(next);
    if (Object.keys(errors).length) return badRequest("Fix the errors.", errors);

    const email = next.email.toLowerCase().trim();
    if (db.data.clients.some((c) => c.id !== client.id && c.email.toLowerCase() === email))
      return conflict("Is email ka client pehle se hai.");

    Object.assign(client, {
      name: next.name.trim(),
      email,
      address: next.address.trim(),
      city: next.city.trim(),
      code: String(next.code),
      country: next.country.trim(),
      updatedAt: new Date().toISOString(),
    });
    db.commit();
    return ok({ client });
  }),

  http.delete(url("/clients/:id"), async ({ request, params }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    const client = db.data.clients.find((c) => c.id === params.id);
    if (!client) return notFound("Client");

    const hasInvoices = db.data.invoices.some((inv) => inv.clientId === client.id);
    if (hasInvoices) return conflict("Client ki invoices hain — pehle unhe delete/cancel karo.");

    db.data.clients = db.data.clients.filter((c) => c.id !== client.id);
    db.commit();
    return ok({ deleted: true });
  }),
];
