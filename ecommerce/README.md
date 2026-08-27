# Nexa Store — Backend-shaped Ecommerce Frontend

A Vite + React learning app whose UI talks to a **real API shape**. Today that API is mocked in-browser with [MSW](https://mswjs.io/). Tomorrow you implement the same routes on a real server — **no frontend rewrite**.

Parent folder `react-invoice-app/` has an older invoice app. **All work for this project stays inside `ecommerce/`.**

## Quick start

```bash
cd ecommerce
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

| Script | What it does |
|--------|----------------|
| `npm run dev` | Vite dev server |
| `npm test` | 32 Vitest contract tests against MSW handlers |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |

## Demo accounts

Password for all: **`Password123!`**

| Email | Role | Notes |
|-------|------|--------|
| `owner@nexa.test` | Super Admin | Wildcard `*` permissions |
| `admin@nexa.test` | Admin | Full ops except roles/settings manage |
| `manager@nexa.test` | Store Manager | Catalog, orders, customers, inventory |
| `staff@nexa.test` | Support Staff | View + update order status |
| `customer@nexa.test` | Customer | Storefront + own orders/profile |
| `suspended@nexa.test` | Staff (suspended) | Login rejected — useful for auth tests |

## Mock → real backend switch

Config lives in `.env` (see `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_ENABLE_MOCK_API=true
```

| Mode | Env | What happens |
|------|-----|----------------|
| Learning / demo | `VITE_ENABLE_MOCK_API=true` | MSW intercepts `VITE_API_BASE_URL` in the browser |
| Real API | `VITE_ENABLE_MOCK_API=false` | Axios hits your server at `VITE_API_BASE_URL` |

When your backend is ready:

1. Implement routes from [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
2. Point `VITE_API_BASE_URL` at that server (keep `/api/v1` prefix)
3. Set `VITE_ENABLE_MOCK_API=false`
4. Restart `npm run dev`

The Axios client, refresh interceptor, and TanStack Query keys already match the contract.

## Folder map

```
ecommerce/
├── docs/                    ← API contract, data model, backend roadmap
├── public/                  ← favicon, MSW service worker
├── src/
│   ├── api/endpoints.js     ← every HTTP call the UI makes (your route checklist)
│   ├── auth/                ← AuthProvider, guards (RequireAuth / Permission / Guest)
│   ├── components/          ← layout + shared UI
│   ├── hooks/               ← list params (page/search/sort/filter)
│   ├── lib/
│   │   ├── apiClient.js     ← Axios + JWT refresh interceptor
│   │   ├── permissions.js   ← permission string catalog (RBAC source of truth)
│   │   └── tokenStore.js    ← access/refresh token storage
│   ├── mocks/
│   │   ├── db.js            ← in-browser “tables” (seed data)
│   │   ├── http.js          ← envelope, JWT helpers, guard, pagination
│   │   └── handlers/        ← MSW route implementations + contract tests
│   ├── pages/
│   │   ├── admin/           ← dashboard, catalog, orders, users, …
│   │   ├── auth/            ← login / register / forgot / reset
│   │   ├── account/         ← profile, my orders
│   │   └── store/           ← catalog, cart, checkout
│   └── store/CartContext.jsx
└── .env.example
```

Urdu comments in mock/lib code teach backend concepts (transactions, IDOR, N+1, etc.) — keep them.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/API_CONTRACT.md](docs/API_CONTRACT.md) | Every endpoint: method, auth, body, status codes |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Tables, relationships, indexes, sample Postgres SQL |
| [docs/BACKEND_ROADMAP.md](docs/BACKEND_ROADMAP.md) | Step-by-step path to build the real API |

**Suggested day 1:** follow step 1–2 of the roadmap (scaffold + health check + migrations from the data model).
