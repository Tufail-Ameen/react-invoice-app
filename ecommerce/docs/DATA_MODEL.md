# Data Model

In-memory “tables” live in `src/mocks/db.js` (persisted to `localStorage` key `nexa.mock.db.v1`). Your real database should mirror these entities.

IDs in the mock are string prefixes (`usr_`, `prd_`, …). In Postgres you may use UUID or bigint — keep the same relations either way.

---

## Entity overview

```
roles ──< users
roles ──< role_permissions >── permissions   (normalized form; mock embeds permissions[] on role)

users ──< sessions
users ──< password_reset_tokens
users ──○ customers          (customers.userId nullable; storefront link)
users ──< customers.createdBy
users ──< audit_logs.actorId
users ──< inventory_movements.createdBy

categories ──< products
products ──< order_items >── orders
customers ──< orders
products ──< inventory_movements

settings                     (single-row / key-value store)
```

---

## Tables

### `users`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| first_name | text | |
| last_name | text | |
| email | citext / text | **UNIQUE**, store lowercased |
| password_hash | text | mock stores plaintext — **hash with bcrypt/argon2** in real API |
| phone | text nullable | |
| role_id | FK → roles | |
| status | text | `active` \| `suspended` |
| email_verified_at | timestamptz nullable | |
| last_login_at | timestamptz nullable | |
| created_at | timestamptz | |

**Rules:** suspended users cannot authenticate or refresh. Deleting a user clears their sessions. Cannot delete/demote last active super_admin (enforced in handlers).

### `roles`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| name | text | |
| slug | text | **UNIQUE** |
| description | text | |
| is_system | boolean | system roles cannot be deleted |
| created_at | timestamptz | optional |

Seed slugs: `super_admin`, `admin`, `manager`, `staff`, `customer`.

### `permissions` + `role_permissions`

Mock stores `role.permissions: string[]` (or `['*']`). Prefer normalized tables:

| `permissions` | `role_permissions` |
|---------------|---------------------|
| id, key (**UNIQUE**), label? | role_id, permission_id (composite PK) |

Keys must match `src/lib/permissions.js`. Super Admin may skip pivot rows and grant `*` in app code.

### `customers`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| first_name, last_name | text | |
| email | text | **UNIQUE** (lowercased) |
| phone | text nullable | |
| company | text nullable | |
| status | text | `active` \| `inactive` |
| notes | text | |
| address_line1, city, postal_code, country | text | mock nests as `address` object |
| user_id | FK → users nullable | **UNIQUE** recommended (one customer profile per user) |
| created_by | FK → users nullable | admin-created rows |
| created_at, updated_at | timestamptz | |

**Delete rule:** hard-delete only if zero orders; otherwise set `inactive` (handler returns 409).

**Register side effect:** self-register creates user + customer in one transaction.

### `categories`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| name | text | |
| slug | text | **UNIQUE** |
| description | text | |
| created_at | timestamptz | |

**Delete rule:** hard-delete only if no products reference it.

### `products`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| name | text | |
| slug | text | unique recommended |
| sku | text | **UNIQUE** (store uppercased) |
| description | text | |
| category_id | FK → categories | |
| price | numeric | > 0 |
| compare_at_price | numeric nullable | must be > price if set |
| cost | numeric nullable | |
| stock | integer | ≥ 0; source of truth for availability |
| low_stock_threshold | integer | default 10 |
| status | text | `active` \| `draft` (extend with `archived` if you soft-delete) |
| image_url | text nullable | |
| created_at, updated_at | timestamptz | |

**Delete rule:** hard-delete blocked if any `order_items` reference the product (409). Prefer status `archived` / soft-delete column in production.

**Indexes:** unique `(sku)`; index `(category_id)`, `(status)`, `(stock)` for inventory filters.

### `orders`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| order_number | text | **UNIQUE** (e.g. `NX-10240`) |
| customer_id | FK → customers | |
| customer_name, customer_email | text | denormalized snapshot at place time |
| status | text | see state machine in API_CONTRACT |
| payment_status | text | `unpaid` \| `paid` \| `refunded` |
| payment_method | text | `card` \| `cash_on_delivery` |
| subtotal, tax_total, shipping_total, discount_total, grand_total | numeric | server-calculated |
| currency | text | from settings |
| shipping address fields | text | snapshot |
| placed_at, updated_at | timestamptz | |
| timeline | jsonb | array of `{ status, note, at, by }` — or separate `order_events` table |

### `order_items`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| order_id | FK → orders ON DELETE CASCADE | |
| product_id | FK → products | keep FK even if product later archived |
| name, sku | text | snapshot |
| unit_price | numeric | snapshot of price at purchase |
| quantity | integer | |
| line_total | numeric | |

### `inventory_movements`

Append-only ledger. **Do not update/delete rows** in normal flows.

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| product_id | FK → products | |
| product_name, sku | text | denormalized for history |
| type | text | `purchase` \| `sale` \| `return` \| `adjustment` |
| quantity | integer | signed: sales negative, purchases/returns positive |
| reason | text | |
| balance_after | integer | stock after this movement |
| created_by | FK → users / `'system'` | |
| created_at | timestamptz | |

Stock on `products.stock` must stay consistent with the latest `balance_after` for that product (update both in one transaction).

### `audit_logs`

| Column | Type | Notes |
|--------|------|--------|
| id | PK | |
| actor_id | FK nullable | |
| actor_name | text | |
| action | text | e.g. `customer.created` |
| resource_type | text | |
| resource_id | text nullable | |
| meta | jsonb | |
| ip | text | |
| created_at | timestamptz | |

Append-only. Mock caps at 500 rows — real systems retain longer / partition by time.

### `sessions` (refresh tokens)

| Column | Type | Notes |
|--------|------|--------|
| id | PK | optional |
| token | text | **UNIQUE** — store hash of refresh token in production |
| user_id | FK → users | |
| created_at, expires_at | timestamptz | |

Rotation: delete old token row when refreshing. Logout / password change / suspend deletes matching rows.

### `password_reset_tokens`

| Column | Type | Notes |
|--------|------|--------|
| token | text PK or unique | hash in production |
| user_id | FK → users | one active token per user (replace on new request) |
| expires_at | timestamptz | mock: 30 minutes |

### `settings`

Single-row table or key/value:

| Key | Example |
|-----|---------|
| store_name | Nexa Store |
| support_email | support@nexa.test |
| currency | PKR |
| tax_rate | 17 |
| free_shipping_threshold | 10000 |
| low_stock_alerts | true |

---

## Soft-delete vs hard-delete (as implemented)

| Resource | Behavior |
|----------|----------|
| Product with order history | **Hard delete forbidden** (409) |
| Customer with orders | **Hard delete forbidden** (409) → use `inactive` |
| Category with products | **Hard delete forbidden** (409) |
| System roles | **Hard delete forbidden** (403) |
| Super Admin user | **Hard delete forbidden** (403) |
| Users / products / customers / categories / non-system roles with no blockers | Hard delete (204) |
| Inventory movements, audit logs, order timeline | Append-only |

Recommendation for a real backend: add `deleted_at` on products/customers instead of hard delete even when “allowed,” and keep the same 409 rules for historical integrity.

---

## Sample SQL (Postgres)

```sql
CREATE TABLE roles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
  id  TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE
);

CREATE TABLE role_permissions (
  role_id       TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id                TEXT PRIMARY KEY,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             CITEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  phone             TEXT,
  role_id           TEXT NOT NULL REFERENCES roles(id),
  status            TEXT NOT NULL CHECK (status IN ('active', 'suspended')),
  email_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id         BIGSERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE customers (
  id           TEXT PRIMARY KEY,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  email        CITEXT NOT NULL UNIQUE,
  phone        TEXT,
  company      TEXT,
  status       TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  notes        TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  city         TEXT NOT NULL DEFAULT '',
  postal_code  TEXT NOT NULL DEFAULT '',
  country      TEXT NOT NULL DEFAULT '',
  user_id      TEXT UNIQUE REFERENCES users(id),
  created_by   TEXT REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  sku                  TEXT NOT NULL UNIQUE,
  description          TEXT NOT NULL DEFAULT '',
  category_id          TEXT NOT NULL REFERENCES categories(id),
  price                NUMERIC(12,2) NOT NULL CHECK (price > 0),
  compare_at_price     NUMERIC(12,2),
  cost                 NUMERIC(12,2),
  stock                INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold  INTEGER NOT NULL DEFAULT 10,
  status               TEXT NOT NULL CHECK (status IN ('active', 'draft', 'archived')),
  image_url            TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_stock_idx ON products(stock);

CREATE TABLE orders (
  id              TEXT PRIMARY KEY,
  order_number    TEXT NOT NULL UNIQUE,
  customer_id     TEXT NOT NULL REFERENCES customers(id),
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  status          TEXT NOT NULL,
  payment_status  TEXT NOT NULL,
  payment_method  TEXT NOT NULL,
  subtotal        NUMERIC(12,2) NOT NULL,
  tax_total       NUMERIC(12,2) NOT NULL,
  shipping_total  NUMERIC(12,2) NOT NULL,
  discount_total  NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL,
  ship_line1      TEXT NOT NULL,
  ship_city       TEXT NOT NULL,
  ship_postal     TEXT NOT NULL,
  ship_country    TEXT NOT NULL,
  timeline        JSONB NOT NULL DEFAULT '[]',
  placed_at       TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX orders_customer_id_idx ON orders(customer_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_placed_at_idx ON orders(placed_at DESC);

CREATE TABLE order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id),
  name        TEXT NOT NULL,
  sku         TEXT NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  line_total  NUMERIC(12,2) NOT NULL
);

CREATE TABLE inventory_movements (
  id            TEXT PRIMARY KEY,
  product_id    TEXT NOT NULL REFERENCES products(id),
  product_name  TEXT NOT NULL,
  sku           TEXT NOT NULL,
  type          TEXT NOT NULL,
  quantity      INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX inventory_movements_product_id_idx ON inventory_movements(product_id);

CREATE TABLE audit_logs (
  id            TEXT PRIMARY KEY,
  actor_id      TEXT,
  actor_name    TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  meta          JSONB NOT NULL DEFAULT '{}',
  ip            TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at DESC);

CREATE TABLE settings (
  id                       SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name               TEXT NOT NULL,
  support_email            TEXT NOT NULL,
  currency                 TEXT NOT NULL,
  tax_rate                 NUMERIC(5,2) NOT NULL,
  free_shipping_threshold  NUMERIC(12,2) NOT NULL,
  low_stock_alerts         BOOLEAN NOT NULL DEFAULT TRUE
);
```

Enable `citext` with `CREATE EXTENSION IF NOT EXISTS citext;` or use `LOWER(email)` unique indexes instead.

---

## Seed roles (permission sets)

Matches `ROLE_SEED` in `db.js`:

| Slug | Permissions |
|------|-------------|
| `super_admin` | `*` |
| `admin` | all catalog permissions except `roles.manage`, `settings.manage` |
| `manager` | dashboard, products view/create/update, categories, customers view/create/update, orders view/update, inventory view/adjust, reports.view |
| `staff` | dashboard, products/categories/customers/orders/inventory **view**, plus `orders.update` |
| `customer` | none (storefront uses auth ownership, not RBAC permissions) |
