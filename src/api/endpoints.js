import { del, get, patch, post } from "../lib/apiClient";

/**
 * Har backend resource ka mapping.
 * Real API banate waqt sirf ye file + docs/API_CONTRACT.md dekho.
 */

export const authApi = {
  login: (body) => post("/auth/login", body),
  logout: (refreshToken) => post("/auth/logout", { refreshToken }),
  me: () => get("/auth/me"),
  refresh: (refreshToken) => post("/auth/refresh", { refreshToken }),
};

export const clientsApi = {
  list: (params) => get("/clients", params),
  detail: (id) => get(`/clients/${id}`),
  create: (body) => post("/clients", body),
  update: ({ id, ...body }) => patch(`/clients/${id}`, body),
  remove: (id) => del(`/clients/${id}`),
};

export const productsApi = {
  list: (params) => get("/products", params),
  detail: (id) => get(`/products/${id}`),
  create: (body) => post("/products", body),
  update: ({ id, ...body }) => patch(`/products/${id}`, body),
  remove: (id) => del(`/products/${id}`),
};

export const inventoryApi = {
  adjust: (body) => post("/inventory/adjust", body),
  movements: (params) => get("/inventory/movements", params),
};

export const invoicesApi = {
  list: (params) => get("/invoices", params),
  detail: (id) => get(`/invoices/${id}`),
  create: (body) => post("/invoices", body),
  update: ({ id, ...body }) => patch(`/invoices/${id}`, body),
  updateStatus: ({ id, status }) => patch(`/invoices/${id}/status`, { status }),
  remove: (id) => del(`/invoices/${id}`),
};
