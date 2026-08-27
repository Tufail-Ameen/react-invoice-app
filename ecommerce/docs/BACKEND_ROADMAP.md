# Backend Roadmap

Build a real API that this frontend can call **without rewriting the UI**. Stack-neutral: Node/Express, Laravel, Django, .NET, etc. Examples below lean **Node + Express + PostgreSQL** when a concrete snippet helps.

Keep the frontend running with MSW (`VITE_ENABLE_MOCK_API=true`) until each step passes against the contract. Verify with the UI demos and/or port ideas from `src/mocks/handlers/handlers.test.js`.

Reference docs:

- [API_CONTRACT.md](./API_CONTRACT.md) — routes & envelopes
- [DATA_MODEL.md](./DATA_MODEL.md) — tables & SQL
- `src/lib/permissions.js` — permission strings
- `src/api/endpoints.js` — exact paths the UI calls

---

## 1. Project scaffold + health check

**Goal:** empty API that responds on the same origin shape the frontend expects.

1. Create a new backend repo/folder (sibling to `ecommerce/` is fine — not inside the Vite `src/`).
2. Mount routes under **`/api/v1`**.
3. Enable CORS for `http://localhost:5173`.
4. Add `GET /api/v1/health` → `{ "data": { "ok": true } }` (optional; not used by UI yet).
5. Run API on port **4000** so it matches `.env.example` (`VITE_API_BASE_URL=http://localhost:4000/api/v1`).

**Done when:** `curl http://localhost:4000/api/v1/health` works.

---

## 2. DB + migrations from DATA_MODEL

1. Create Postgres database.
2. Apply migrations from [DATA_MODEL.md](./DATA_MODEL.md) (tables + indexes).
3. Seed:
   - permission keys from `PERMISSIONS`
   - five roles + demo users (same emails as README; **hash** passwords)
   - a few categories/products/customers so storefront isn’t empty
4. Settings single row with tax 17, free shipping 10000, currency PKR.

**Done when:** you can query seeded `owner@nexa.test` and roles from SQL.

---

## 3. Auth (register / login / refresh / logout / me)

Implement handlers matching auth section of the contract:

| Route | Notes |
|-------|--------|
| `POST /auth/register` | Hash password; create user + customer in **one transaction**; return tokens |
| `POST /auth/login` | Constant-time compare; same error for bad email/password; reject suspended |
| `POST /auth/refresh` | Verify refresh JWT + session row; **rotate** (delete old, insert new) |
| `POST /auth/logout` | Delete session by refresh token → 204 |
| `GET /auth/me` | Bearer access → user + permissions |
| `PATCH /auth/profile` | |
| `POST /auth/change-password` | Kill all sessions; issue new tokens |
| `POST /auth/forgot-password` | Always same message; store hashed reset token |
| `POST /auth/reset-password` | |

Response envelope: `{ data }` / `{ error: { code, message, details } }` exactly as MSW.

**JWT:** access ~15m, refresh ~7d; payloads include `sub`, `type`. Store **hashed** refresh tokens in `sessions`.

**Done when:** login as `owner@nexa.test` with Postman returns user + tokens; refresh rotates; `/auth/me` works with Bearer header.

---

## 4. RBAC middleware

1. Load user’s role permissions (expand `*` to allow everything).
2. Middleware: `requireAuth` + `requirePermission('customers.create')`.
3. Mirror `guard()` in `src/mocks/http.js`: 401 if no/invalid access token; 403 if missing permission.
4. `GET /roles` allows `roles.view` **or** `users.view`.

**Done when:** `staff@nexa.test` gets 403 on `POST /products`; `manager@nexa.test` succeeds on product create.

---

## 5. Customers CRUD (learn the list-refresh loop)

Implement `/customers` exactly as contract (pagination, search, status filter, stats, delete rules).

**Frontend learning loop:**

1. Open Admin → Customers while still on MSW — note add form → list refresh (TanStack Query invalidates `queryKeys.customers`).
2. Point only customers routes at your API first if you want (or wait until full cutover).
3. Create a customer → list should show it after invalidation; duplicate email → 409 with envelope.

**Done when:** create/list/detail/update/delete match contract tests’ expectations; 409 when customer has orders.

---

## 6. Products & categories

- Admin `/products`, `/categories` + public `/storefront/*`
- Unique SKU / category slug
- Product create with stock > 0 writes opening `inventory_movements` row
- Storefront only returns `active` products

**Done when:** catalog page and admin products both work against your API.

---

## 7. Orders + state machine + IDOR on account orders

1. Admin list/detail + `PATCH /orders/:id/status` using `ORDER_TRANSITIONS` from `orders.js`.
2. Cancel → restock + ledger `return`.
3. `POST /orders/:id/refund` only if paid.
4. `GET /account/orders` and `/:id` — **ownership only** (userId or email match). Wrong owner → **404**, not 403.

**Done when:** illegal transition returns 409; guessing another user’s order id returns 404.

---

## 8. Checkout transaction

`POST /checkout` must be one DB transaction:

1. Lock product rows (`SELECT … FOR UPDATE`)
2. Validate stock & active status
3. Compute money **server-side** from settings (ignore client totals)
4. Upsert/link customer
5. Insert order + items
6. Decrement stock + insert `sale` movements
7. Audit `order.placed`
8. Commit

**Done when:** concurrent checkouts cannot oversell; card vs COD payment status matches contract.

---

## 9. Inventory adjustments + ledger

- `GET /inventory`, `GET /inventory/movements`, `POST /inventory/adjust`
- Adjustments: non-zero integer, reason required, no negative stock
- Append-only movements

**Done when:** adjust −5 updates product stock and appears in movements.

---

## 10. Dashboard aggregates

`GET /dashboard/summary` — KPIs, 14-day revenue series, status counts, top products, recent orders, low stock.

Prefer SQL aggregates (`SUM`, `COUNT`, `GROUP BY`) over N+1 loops.

**Done when:** Admin dashboard loads with plausible numbers from your seed + new checkouts.

---

## 11. Audit log

Write audit rows from mutations (same action names as mock: `customer.created`, `order.status_changed`, …).

`GET /audit-logs` with search/filters + facets.

**Done when:** performing actions as admin fills the Audit page.

---

## 12. Settings

`GET/PATCH /settings` behind `settings.manage` (super_admin only in seed). Tax 0–100. Checkout must read live settings for tax/shipping.

**Done when:** changing free-shipping threshold changes checkout shipping on next order.

---

## Cutover: turn off MSW

When the above routes exist and envelope/status codes match:

1. In `ecommerce/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_ENABLE_MOCK_API=false
```

2. Restart Vite (`npm run dev`).
3. Smoke-test:
   - Login all demo roles
   - Storefront browse → cart → checkout
   - Admin: customers create, product create, order status change, inventory adjust
   - Customer: My Orders only shows own orders
4. Keep `npm test` for MSW contract regressions while developing; add backend integration tests separately.

No changes needed to `endpoints.js`, pages, or Axios if you matched the contract.

---

## Suggested day-1 checklist

```text
[ ] Backend project boots on :4000
[ ] GET /api/v1/health returns { data: { ok: true } }
[ ] Postgres up; first migration applied (users/roles/permissions at minimum)
[ ] Seed super_admin user with hashed Password123!
[ ] POST /auth/login works; GET /auth/me with Bearer works
[ ] Skim API_CONTRACT auth + customers sections for tomorrow
```

Day 2+: finish auth surface → RBAC → customers (step 5) while using the UI as your acceptance test.

---

## Tips while learning

- **Never trust the client** for prices, totals, or permissions — UI hiding a button is not security.
- **Transactions** for register (user+customer) and checkout (stock+order).
- **IDOR:** always scope account resources to the authenticated user.
- Match **error codes** (`VALIDATION_ERROR`, `UNAUTHENTICATED`, …) so `ApiError` and form helpers keep working.
- Prefer implementing one resource fully (customers) before spraying half-done routes.
