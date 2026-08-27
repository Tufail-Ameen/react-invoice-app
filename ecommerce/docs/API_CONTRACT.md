# API Contract

Base URL: **`/api/v1`** (full default: `http://localhost:4000/api/v1`)

This document mirrors `src/api/endpoints.js` and `src/mocks/handlers/*`. Implement these routes on a real server and the existing frontend should work without rewrite.

Source of truth for permission strings: `src/lib/permissions.js`.

---

## Conventions

### Success envelope

```json
{ "data": { /* payload */ } }
```

HTTP status is usually `200`. Creates use `201`. Deletes that succeed return **`204` with an empty body** (no `{ data }`).

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": { "fieldName": ["Message"] }
  }
}
```

| HTTP | `error.code` | When |
|------|--------------|------|
| 400 | `VALIDATION_ERROR` | Bad input / field errors |
| 401 | `UNAUTHENTICATED` | Missing/expired/invalid token, bad login |
| 403 | `FORBIDDEN` | Authenticated but missing permission |
| 404 | `NOT_FOUND` | Resource missing (also used for IDOR on account orders) |
| 409 | `CONFLICT` | Business rule clash (duplicate, bad state transition, stock) |

`details` is often a map of field → string array (for forms). Sometimes it is omitted.

### Auth

- **Access token:** `Authorization: Bearer <accessToken>` on protected routes.
- **Access TTL (mock):** 15 minutes (`expiresIn` seconds returned with tokens).
- **Refresh TTL (mock):** 7 days.
- **Refresh rotation:** `POST /auth/refresh` invalidates the old refresh token and issues a new pair. Refresh tokens are stored as server sessions.
- Frontend refresh is handled by `src/lib/apiClient.js` (not listed in `endpoints.js`, but required).

Token payload shape (JWT-like):

```json
{ "sub": "<userId>", "type": "access" | "refresh", "iat": 0, "exp": 0 }
```

### List query params (paginated endpoints)

| Param | Default | Notes |
|-------|---------|--------|
| `page` | `1` | ≥ 1 |
| `per_page` | `10` | 1–100 |
| `sort` | endpoint-specific | Prefix `-` for descending, e.g. `-createdAt` |
| `search` | — | Case-insensitive substring on documented fields |

Pagination meta in responses:

```json
{
  "meta": {
    "page": 1,
    "perPage": 10,
    "total": 42,
    "lastPage": 5,
    "sort": "-createdAt"
  }
}
```

### User object (`serializeUser`)

Returned by auth and user endpoints (password never included):

```json
{
  "id": "usr_…",
  "firstName": "Zain",
  "lastName": "Ahmed",
  "fullName": "Zain Ahmed",
  "email": "owner@nexa.test",
  "phone": "+92 300 1234567",
  "status": "active",
  "emailVerifiedAt": "ISO-8601 | null",
  "lastLoginAt": "ISO-8601 | null",
  "createdAt": "ISO-8601",
  "role": { "id": "role_…", "name": "Super Admin", "slug": "super_admin" },
  "permissions": ["*"]
}
```

`permissions` comes from the user’s role. Super Admin uses wildcard `"*"`.

### Tokens object

```json
{
  "accessToken": "…",
  "refreshToken": "…",
  "expiresIn": 900
}
```

---

## Auth

Handlers: `src/mocks/handlers/auth.js`

### `POST /auth/register`

- **Auth:** public
- **Body:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string (≥8)",
  "passwordConfirmation": "string",
  "phone": "string | optional"
}
```

- **Success `201`:** `{ data: { user, tokens } }`
- **Side effects:** creates `users` row with `role_customer`; creates linked `customers` row (`userId` set); audits `auth.registered`
- **Errors:** `400` validation; `409` email already registered

### `POST /auth/login`

- **Auth:** public
- **Body:** `{ "email", "password" }`
- **Success `200`:** `{ data: { user, tokens } }`
- **Errors:** `401` wrong credentials (same message whether email missing — anti-enumeration); `401` if `status === "suspended"`
- **Side effects:** updates `lastLoginAt`; audits `auth.logged_in`

### `POST /auth/refresh`

- **Auth:** public (body carries refresh token)
- **Body:** `{ "refreshToken": "string" }`
- **Success `200`:** `{ data: { user, tokens } }`
- **Errors:** `401` invalid/expired/revoked refresh, or user not active
- **Behavior:** old refresh session removed (rotation); new tokens issued

### `POST /auth/logout`

- **Auth:** public (refresh token in body)
- **Body:** `{ "refreshToken"?: "string" }`
- **Success `204`:** empty
- Revokes matching session if provided

### `GET /auth/me`

- **Auth:** Bearer access
- **Success `200`:** `{ data: { user, permissions } }`

### `PATCH /auth/profile`

- **Auth:** Bearer access
- **Body (partial):** `{ "firstName"?, "lastName"?, "phone"? }`
- **Success `200`:** `{ data: { user } }`
- Audits `profile.updated`

### `POST /auth/change-password`

- **Auth:** Bearer access
- **Body:** `{ "currentPassword", "newPassword" }` (`newPassword` ≥ 8)
- **Success `200`:** `{ data: { tokens } }` (new session; all prior sessions for user cleared)
- **Errors:** `400` wrong current / weak new password
- Audits `auth.password_changed`

### `POST /auth/forgot-password`

- **Auth:** public
- **Body:** `{ "email" }`
- **Success `200`:** always same message shape whether email exists (anti-enumeration)

```json
{ "data": { "message": "…", "devToken": "rst_…" } }
```

`devToken` is **mock-only** (so you can test reset without email). Real backends should email a link and omit `devToken`.

### `POST /auth/reset-password`

- **Auth:** public
- **Body:** `{ "token", "password", "passwordConfirmation" }`
- **Success `200`:** `{ data: { message } }`
- Clears reset token + all sessions for that user
- **Errors:** `400` invalid/expired token or password mismatch

---

## Products (admin)

Permission prefix: `products.*`  
Handlers: `src/mocks/handlers/catalog.js`

### Product shape (admin + storefront enrichment)

Base fields plus:

```json
{
  "category": { "id", "name", "slug" } | null,
  "inStock": true,
  "lowStock": false,
  "margin": 42
}
```

`margin` is percent from `(price - cost) / price`, or `null` if no cost.

Status values: `active` | `draft` (seed also uses these).

### Filters (`GET /products`, storefront list)

| Query | Meaning |
|-------|---------|
| `search` | name, sku, description |
| `status` | exact status |
| `category_id` | exact category id |
| `stock` | `in` \| `low` \| `out` |
| `min_price` / `max_price` | numeric bounds |

Default sort: `-createdAt`.

### `GET /products`

- **Permission:** `products.view`
- **Success:** `{ data: { items: Product[], meta } }`

### `GET /products/:id`

- **Permission:** `products.view`
- **Success:** `{ data: { product } }`
- **404** if missing

### `POST /products`

- **Permission:** `products.create`
- **Body:**

```json
{
  "name": "string",
  "sku": "string",
  "categoryId": "cat_…",
  "price": 1000,
  "compareAtPrice": 1200,
  "cost": 500,
  "stock": 10,
  "lowStockThreshold": 10,
  "status": "draft" | "active",
  "description": "string",
  "imageUrl": "string | null"
}
```

- Validates: name, sku unique (case-insensitive), categoryId, price > 0, stock ≥ 0, compareAtPrice > price if set
- Slug auto from name; SKU stored uppercased
- If `stock > 0`, writes inventory movement `type: "purchase"`
- **Success `201`:** `{ data: { product } }`
- Audits `product.created`

### `PATCH /products/:id`

- **Permission:** `products.update`
- Same validation merged with existing row
- **Success `200`:** `{ data: { product } }`
- Audits `product.updated`

### `DELETE /products/:id`

- **Permission:** `products.delete`
- **409** if product appears on any order item — prefer archive instead
- **Success `204`**
- Audits `product.deleted`

---

## Categories (admin)

### `GET /categories`

- **Permission:** `categories.view`
- **Success:** `{ data: { items: Category[] } }`  
  Each item includes `productCount` (all products in category, any status)

### `POST /categories`

- **Permission:** `categories.manage`
- **Body:** `{ "name", "description"? }`
- Slug from name; **409** on duplicate slug
- **Success `201`:** `{ data: { category } }` (`productCount: 0`)

### `PATCH /categories/:id`

- **Permission:** `categories.manage`
- **Body:** `{ "name"?, "description"? }`
- **Success `200`:** `{ data: { category } }`

### `DELETE /categories/:id`

- **Permission:** `categories.manage`
- **409** if any products still reference it
- **Success `204`**

---

## Customers

Handlers: `src/mocks/handlers/customers.js`  
Permissions: `customers.*`

### Customer with stats

```json
{
  "id": "cus_…",
  "firstName": "…",
  "lastName": "…",
  "fullName": "…",
  "email": "…",
  "phone": "…",
  "company": "… | null",
  "status": "active" | "inactive",
  "notes": "…",
  "address": { "line1", "city", "postalCode", "country" },
  "userId": "usr_… | null",
  "createdBy": "usr_… | null",
  "createdAt": "…",
  "updatedAt": "…",
  "ordersCount": 3,
  "totalSpent": 12000,
  "lastOrderAt": "ISO | null"
}
```

`totalSpent` sums `grandTotal` where `paymentStatus === "paid"`.

### Filters

`search` on firstName, lastName, email, phone, company; `status` exact. Default sort `-createdAt`.

### `GET /customers`

- **Permission:** `customers.view`
- **Success:** `{ data: { items, meta } }`

### `GET /customers/:id`

- **Permission:** `customers.view`
- **Success:** `{ data: { customer, orders: OrderSummary[] } }`  
  Nested orders: id, orderNumber, status, paymentStatus, grandTotal, currency, itemCount, placedAt

### `POST /customers`

- **Permission:** `customers.create`
- **Body:** firstName, lastName, email, phone?, company?, status?, notes?, address?
- Unique email; phone format `^[\d\s+()-]{7,20}$` if provided
- **Success `201`:** `{ data: { customer } }` (`userId: null`, `createdBy` = actor)

### `PATCH /customers/:id`

- **Permission:** `customers.update`
- **Success `200`:** `{ data: { customer } }`

### `DELETE /customers/:id`

- **Permission:** `customers.delete`
- **409** if customer has any orders — set status `inactive` instead
- **Success `204`**

---

## Orders (admin)

Handlers: `src/mocks/handlers/orders.js`  
Permissions: `orders.view` | `orders.update` | `orders.refund`

### Status state machine

| From | Allowed next |
|------|----------------|
| `pending` | `processing`, `cancelled` |
| `processing` | `shipped`, `cancelled` |
| `shipped` | `delivered` |
| `delivered` | `refunded` |
| `cancelled` | _(none)_ |
| `refunded` | _(none)_ |

Cancel restocks items (`inventory` type `return`) and sets payment to `refunded` if previously `paid`, else `unpaid`.

Payment status values: `unpaid` | `paid` | `refunded`.  
Payment methods: `card` | `cash_on_delivery`.

### Order list summary

```json
{
  "id", "orderNumber", "customerId", "customerName", "customerEmail",
  "status", "paymentStatus", "paymentMethod",
  "itemCount", "grandTotal", "currency", "placedAt"
}
```

### Filters

`search` (orderNumber, customerName, customerEmail), `status`, `payment_status`, `customer_id`, `from` / `to` (ISO date on `placedAt`). Default sort `-placedAt`.

### `GET /orders`

- **Permission:** `orders.view`
- **Success:** `{ data: { items, meta, totals: { count, revenue } } }`  
  `revenue` = sum of `grandTotal` for filtered rows with `paymentStatus === "paid"`

### `GET /orders/:id`

- **Permission:** `orders.view`
- **Success:** `{ data: { order, customer, allowedTransitions: string[] } }`  
  Full order includes `items[]`, totals, `shippingAddress`, `timeline[]`

### `PATCH /orders/:id/status`

- **Permission:** `orders.update`
- **Body:** `{ "status": "processing", "note": "optional" }`
- **409** if transition not allowed
- Appends timeline entry; may restock on cancel
- **Success:** `{ data: { order, allowedTransitions } }`
- Audits `order.status_changed`

### `POST /orders/:id/refund`

- **Permission:** `orders.refund`
- **Body:** `{ "reason"?: "string" }`
- **409** if not `paymentStatus === "paid"`
- Sets status + payment to `refunded`, restocks, timeline note
- **Success:** `{ data: { order } }`
- Audits `order.refunded`

---

## Checkout & account orders

### `POST /checkout`

- **Auth:** Bearer (any active user; no special permission)
- **Body:**

```json
{
  "items": [{ "productId": "prd_…", "quantity": 2 }],
  "shippingAddress": {
    "line1": "…",
    "city": "…",
    "postalCode": "54000",
    "country": "Pakistan"
  },
  "paymentMethod": "card" | "cash_on_delivery"
}
```

- Validates address (postal code exactly 5 digits)
- Stock check then decrement (must be one DB transaction in real backend)
- **Server calculates** subtotal, tax (`settings.taxRate`), shipping (`0` if subtotal ≥ `freeShippingThreshold`, else `350`), grandTotal — never trust client totals
- Only `active` products; **409** on insufficient stock
- Resolves/creates customer linked to user
- Card → `paymentStatus: "paid"`; COD → `unpaid`; status starts `pending`
- Writes `sale` inventory movements
- **Success `201`:** `{ data: { order } }`
- Audits `order.placed`

### `GET /account/orders`

- **Auth:** Bearer
- Orders for customers matching `userId` **or** email (case-insensitive)
- **Success:** `{ data: { items: OrderSummary[], meta } }`

### `GET /account/orders/:id`

- **Auth:** Bearer
- Ownership check: same customer linkage as list
- **404** if missing **or** not owned (IDOR protection — do not leak existence with 403)
- **Success:** `{ data: { order } }`

---

## Users

Handlers: `src/mocks/handlers/users.js`  
Permissions: `users.*`

### Filters

`search` (firstName, lastName, email, phone), `role_id`, `status`. Default sort `-createdAt`.

### `GET /users`

- **Permission:** `users.view`
- **Success:** `{ data: { items: User[], meta } }`

### `GET /users/:id`

- **Permission:** `users.view`
- **Success:** `{ data: { user } }`

### `POST /users`

- **Permission:** `users.create`
- **Body:** firstName, lastName, email, roleId, password (≥8), phone?, status?
- **409** duplicate email
- **403** if assigning `super_admin` without being super_admin
- **Success `201`:** `{ data: { user } }`

### `PATCH /users/:id`

- **Permission:** `users.update`
- Cannot edit super_admin unless actor is super_admin
- Cannot demote last active super_admin (**409**)
- Cannot suspend self (**409**)
- Suspending clears that user’s sessions
- Optional `password` reset on body
- **Success:** `{ data: { user } }`

### `DELETE /users/:id`

- **Permission:** `users.delete`
- **409** delete self; **403** delete super_admin
- Clears sessions
- **Success `204`**

---

## Roles

### `GET /roles`

- **Permission:** `roles.view` **or** `users.view` (either)
- **Success:**

```json
{
  "data": {
    "items": [
      {
        "id", "name", "slug", "description", "isSystem", "permissions",
        "userCount", "permissionCount"
      }
    ],
    "availablePermissions": ["dashboard.view", "…"]
  }
}
```

`permissionCount` for `["*"]` equals full catalog length.

### `POST /roles`

- **Permission:** `roles.manage`
- **Body:** `{ "name", "description"?, "permissions": string[] }`
- Permissions must be subset of catalog; slug from name; **409** duplicate slug
- **Success `201`:** `{ data: { role } }` (`isSystem: false`)

### `PATCH /roles/:id`

- **Permission:** `roles.manage`
- **403** editing `super_admin` permissions/name rules (slug `super_admin` frozen)
- System roles keep slug if `isSystem`
- **Success:** `{ data: { role } }`

### `DELETE /roles/:id`

- **Permission:** `roles.manage`
- **403** if `isSystem`; **409** if users still assigned
- **Success `204`**

---

## Inventory

Handlers: `src/mocks/handlers/system.js`

### `GET /inventory`

- **Permission:** `inventory.view`
- Filters: `search` (name, sku), `state` = `out` | `low` | `healthy`
- Default sort: `stock` ascending
- **Success:**

```json
{
  "data": {
    "items": [
      {
        "id", "name", "sku", "imageUrl", "stock", "lowStockThreshold",
        "status", "stockValue", "state", "updatedAt"
      }
    ],
    "meta": {},
    "summary": {
      "totalUnits": 0,
      "stockValue": 0,
      "outOfStock": 0,
      "lowStock": 0
    }
  }
}
```

### `GET /inventory/movements`

- **Permission:** `inventory.view`
- Filters: `product_id`, `type`, `search` (productName, sku, reason)
- Default sort `-createdAt`
- Movement types used: `purchase` | `sale` | `return` | `adjustment`
- **Success:** `{ data: { items, meta } }`

### `POST /inventory/adjust`

- **Permission:** `inventory.adjust`
- **Body:** `{ "productId", "quantity": ±integer ≠ 0, "reason": "string" }`
- Stock cannot go negative
- Writes movement `type: "adjustment"`
- **Success `201`:** `{ data: { movement, product: { id, stock } } }`
- Audits `inventory.adjusted`

---

## Dashboard

### `GET /dashboard/summary`

- **Permission:** `dashboard.view`
- **Success `data`:**

```json
{
  "kpis": {
    "revenue": 0,
    "revenueChangePercent": 12,
    "orders": 0,
    "customers": 0,
    "products": 0,
    "averageOrderValue": 0,
    "pendingOrders": 0,
    "lowStockCount": 0
  },
  "revenueByDay": [{ "date": "YYYY-MM-DD", "revenue": 0, "orders": 0 }],
  "ordersByStatus": [{ "status": "pending", "count": 0 }],
  "topProducts": [{ "productId", "name", "sku", "unitsSold", "revenue" }],
  "recentOrders": [{ "id", "orderNumber", "customerName", "status", "grandTotal", "currency", "placedAt" }],
  "lowStockProducts": [{ "id", "name", "sku", "stock", "lowStockThreshold" }]
}
```

Revenue uses orders with `paymentStatus === "paid"`. Change % compares last 30 days vs previous 30. `revenueByDay` is last 14 days. Top products capped at 5; recent orders 6; low stock list 6.

---

## Audit log

### `GET /audit-logs`

- **Permission:** `audit.view`
- Filters: `action`, `resource_type`, `search` (actorName, action, resourceType)
- Default sort `-createdAt`
- **Success:**

```json
{
  "data": {
    "items": [
      {
        "id", "actorId", "actorName", "action", "resourceType",
        "resourceId", "meta", "ip", "createdAt"
      }
    ],
    "meta": {},
    "facets": {
      "actions": ["auth.logged_in", "…"],
      "resourceTypes": ["user", "order", "…"]
    }
  }
}
```

Mock keeps at most 500 log rows.

---

## Settings

### `GET /settings`

- **Permission:** `settings.manage`
- **Success:** `{ data: { settings } }`

```json
{
  "storeName": "Nexa Store",
  "supportEmail": "support@nexa.test",
  "currency": "PKR",
  "taxRate": 17,
  "freeShippingThreshold": 10000,
  "lowStockAlerts": true
}
```

### `PATCH /settings`

- **Permission:** `settings.manage`
- **Body:** any subset of settings fields
- `taxRate` must be 0–100 if provided
- **Success:** `{ data: { settings } }`
- Audits `settings.updated`

---

## Storefront (public)

No auth required. Only `status === "active"` products are visible.

### `GET /storefront/products`

Same filters as admin product list (status filter mostly redundant).  
**Success:** `{ data: { items, meta } }`

### `GET /storefront/products/:slug`

**Success:** `{ data: { product, related: Product[] } }` — up to 4 related in same category. **404** if missing/inactive.

### `GET /storefront/categories`

**Success:** `{ data: { items } }` with `productCount` = count of **active** products only.

---

## Mock-only

### `POST /dev/reset`

Resets in-browser mock DB to seed. **Do not ship this on a real API.**

---

## Permission catalog

Copy these exact strings into your backend:

```
dashboard.view
products.view products.create products.update products.delete
categories.view categories.manage
customers.view customers.create customers.update customers.delete
orders.view orders.update orders.refund
inventory.view inventory.adjust
users.view users.create users.update users.delete
roles.view roles.manage
reports.view
audit.view
settings.manage
```

Plus role wildcard `*` for Super Admin.

---

## Contract tests

`src/mocks/handlers/handlers.test.js` (32 Vitest cases) exercises auth, RBAC, CRUD, pagination, checkout stock, order transitions, and account IDOR. Keep them green while changing handlers; use them as acceptance tests when wiring a real server (or port equivalent integration tests).
