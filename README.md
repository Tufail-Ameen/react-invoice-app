# Invoice App (Backend-learning frontend)

Invoices create karo, products add/remove karo, stock manage karo. UI **real API shape** pe baat karti hai — aaj [MSW](https://mswjs.io/) mock, kal tumhara server.

> `ecommerce/` alag demo hai. **Ye root app** invoices + stock ke liye hai.

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### Demo login

| Email | Password |
|-------|----------|
| `owner@invoice.test` | `Password123!` |

## What you can do

- **Invoices** — create (draft / pending), mark paid, cancel; pending/paid stock se qty kaat’ta hai
- **Clients** — add, edit, delete
- **Products & Stock** — add/remove products, adjust qty, movement history

## Mock → real backend

`.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
REACT_APP_ENABLE_MOCK_API=true
```

| Mode | Setting |
|------|---------|
| Learning (default) | `REACT_APP_ENABLE_MOCK_API=true` |
| Real API | `false` + apna server on `:5000` |

Docs:

- [docs/API_CONTRACT.md](docs/API_CONTRACT.md) — har endpoint
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — tables / SQL
- [docs/BACKEND_ROADMAP.md](docs/BACKEND_ROADMAP.md) — step-by-step backend build

Route checklist: [`src/api/endpoints.js`](src/api/endpoints.js)

## Folder map

```
src/
  api/endpoints.js     ← routes the UI calls
  auth/                ← login + route guards
  lib/apiClient.js     ← Axios + JWT refresh
  mocks/               ← MSW “backend” + db seed
  pages/               ← Invoices, Clients, Stock, Login
docs/                  ← contract, model, roadmap
```
