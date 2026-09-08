import { createApi } from "@reduxjs/toolkit/query/react";
import { normalizeClient, normalizeClientsResponse } from "../lib/normalizeClient";
import {
  normalizeProduct,
  normalizeProductsResponse,
} from "../lib/normalizeProduct";
import {
  normalizeSupplier,
  normalizeSuppliersResponse,
} from "../lib/normalizeSupplier";
import { axiosBaseQuery } from "../lib/rtkBaseQuery";

/**
 * Poori app ka RTK Query API slice — sab routes Express server (localhost:5001) se.
 */
export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Client",
    "Product",
    "Category",
    "Movement",
    "Invoice",
    "Estimate",
    "ClientLedger",
    "Supplier",
    "Purchase",
    "SupplierLedger",
    "SalesReturn",
    "PurchaseReturn",
    "Expense",
    "ExpenseCategory",
    "Auth",
    "User",
    "Role",
    "Business",
    "Audit",
  ],
  endpoints: (builder) => ({
    // ---- Auth ----
    login: builder.mutation({
      query: (body) => ({ url: "/login", method: "POST", data: body }),
    }),
    register: builder.mutation({
      query: (body) => ({ url: "/register", method: "POST", data: body }),
    }),
    logout: builder.mutation({
      query: (refreshToken) => ({
        url: "/auth/logout",
        method: "POST",
        data: { refreshToken },
      }),
    }),
    me: builder.query({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Auth"],
    }),
    switchBusiness: builder.mutation({
      query: (body) => ({
        url: "/auth/switch-business",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [
        "Auth",
        "Client",
        "Product",
        "Category",
        "Invoice",
        "Estimate",
        "ClientLedger",
        "Movement",
        "Supplier",
        "Purchase",
        "SupplierLedger",
        "SalesReturn",
        "PurchaseReturn",
        "Expense",
        "ExpenseCategory",
        "User",
        "Role",
        "Audit",
        "Business",
      ],
    }),

    // ---- Team: users ----
    getUsers: builder.query({
      query: (params = {}) => ({ url: "/users", params }),
      providesTags: (result) =>
        result?.users || result?.items
          ? [
              ...(result.users || result.items).map(({ id }) => ({ type: "User", id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),
    inviteUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", data: body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    removeUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    // ---- Team: roles ----
    getRoles: builder.query({
      query: () => ({ url: "/roles" }),
      providesTags: [{ type: "Role", id: "LIST" }],
    }),
    createRole: builder.mutation({
      query: (body) => ({ url: "/roles", method: "POST", data: body }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/roles/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: [{ type: "Role", id: "LIST" }, "Auth"],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `/roles/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),

    // ---- Platform businesses ----
    getPlatformBusinesses: builder.query({
      query: () => ({ url: "/platform/businesses" }),
      providesTags: [{ type: "Business", id: "LIST" }],
    }),
    createPlatformBusiness: builder.mutation({
      query: (body) => ({
        url: "/platform/businesses",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "Business", id: "LIST" }],
    }),
    updatePlatformBusiness: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/platform/businesses/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: [{ type: "Business", id: "LIST" }],
    }),

    // ---- Audit ----
    getAuditLogs: builder.query({
      query: (params = {}) => ({ url: "/audit-logs", params }),
      providesTags: [{ type: "Audit", id: "LIST" }],
    }),

    // ---- Clients (real API: GET returns array, PUT/DELETE use numeric id) ----
    getClients: builder.query({
      query: () => ({ url: "/clients" }),
      transformResponse: normalizeClientsResponse,
      providesTags: (result) =>
        result?.clients
          ? [
              ...result.clients.map((c) => ({ type: "Client", id: c.key || c.id })),
              { type: "Client", id: "LIST" },
            ]
          : [{ type: "Client", id: "LIST" }],
    }),
    getClient: builder.query({
      query: (id) => ({ url: `/clients/${id}` }),
      transformResponse: (response) => ({
        client: normalizeClient(response?.client ?? response),
      }),
      providesTags: (result, error, id) => [{ type: "Client", id }],
    }),
    createClient: builder.mutation({
      query: (body) => ({ url: "/clients", method: "POST", data: body }),
      transformResponse: (response) => ({
        client: normalizeClient(response?.client ?? response),
      }),
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),
    updateClient: builder.mutation({
      query: ({ id, _id, key, ...body }) => ({
        url: `/clients/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({ url: `/clients/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),
    getClientLedger: builder.query({
      query: (id) => ({ url: `/clients/${id}/ledger` }),
      transformResponse: (response) => ({
        client: normalizeClient(response?.customer ?? response?.client),
        entries: response?.entries || [],
        summary: response?.summary,
        pagination: response?.pagination,
      }),
      providesTags: (result, error, id) => [
        { type: "ClientLedger", id },
        { type: "Client", id },
      ],
    }),
    getClientPayments: builder.query({
      query: (id) => ({ url: `/clients/${id}/payments` }),
      providesTags: (result, error, id) => [
        { type: "ClientLedger", id: `PAYMENTS-${id}` },
      ],
    }),
    createClientPayment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/clients/${id}/payments`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
        { type: "ClientLedger", id },
        { type: "ClientLedger", id: `PAYMENTS-${id}` },
        { type: "Invoice", id: "LIST" },
      ],
    }),

    // ---- Products (GET /products → raw array from Express) ----
    getProducts: builder.query({
      query: (params = {}) => ({ url: "/products", params }),
      transformResponse: normalizeProductsResponse,
      providesTags: (result) =>
        result?.products
          ? [
              ...result.products.map(({ id }) => ({ type: "Product", id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProduct: builder.query({
      query: (id) => ({ url: `/products/${id}` }),
      transformResponse: (response) => normalizeProduct(response),
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({ url: "/products", method: "POST", data: body }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
      ],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
      ],
    }),

    // ---- Categories ----
    getCategories: builder.query({
      query: (params = {}) => ({ url: "/categories", params }),
      providesTags: (result) =>
        result?.categories
          ? [
              ...result.categories.map(({ id }) => ({ type: "Category", id })),
              { type: "Category", id: "LIST" },
            ]
          : [{ type: "Category", id: "LIST" }],
    }),
    createCategory: builder.mutation({
      query: (body) => ({ url: "/categories", method: "POST", data: body }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    // ---- Inventory ----
    getMovements: builder.query({
      query: (params = {}) => ({ url: "/inventory/movements", params }),
      providesTags: [{ type: "Movement", id: "LIST" }],
    }),
    getLowStock: builder.query({
      query: () => ({ url: "/inventory/low-stock" }),
      transformResponse: (response) => ({
        products: (response?.products || []).map(normalizeProduct),
      }),
      providesTags: [{ type: "Product", id: "LOW_STOCK" }],
    }),
    adjustInventory: builder.mutation({
      query: (body) => ({ url: "/inventory/adjust", method: "POST", data: body }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "Product", id: "LOW_STOCK" },
        { type: "Movement", id: "LIST" },
      ],
    }),
    openingStock: builder.mutation({
      query: (body) => ({
        url: "/inventory/opening-stock",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "Product", id: "LOW_STOCK" },
        { type: "Movement", id: "LIST" },
      ],
    }),

    // ---- Invoices ----
    getInvoices: builder.query({
      query: (params = {}) => ({ url: "/invoices", params }),
      providesTags: (result) =>
        result?.invoices
          ? [
              ...result.invoices.map(({ id }) => ({ type: "Invoice", id })),
              { type: "Invoice", id: "LIST" },
            ]
          : [{ type: "Invoice", id: "LIST" }],
    }),
    getInvoice: builder.query({
      query: (id) => ({ url: `/invoices/${id}` }),
      providesTags: (result, error, id) => [{ type: "Invoice", id }],
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: "/invoices", method: "POST", data: body }),
      invalidatesTags: [
        { type: "Invoice", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
      ],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/invoices/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    updateInvoiceStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/invoices/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
        "Client",
        "ClientLedger",
      ],
    }),
    confirmInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/confirm`, method: "POST" }),
      invalidatesTags: (result, error, id) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
        "Client",
        "ClientLedger",
      ],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Invoice", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
      ],
    }),
    reverseInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/reverse`, method: "POST" }),
      invalidatesTags: (result, error, id) => [
        { type: "Invoice", id },
        { type: "Invoice", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
        "Client",
        "ClientLedger",
        { type: "SalesReturn", id: "LIST" },
      ],
    }),

    // ---- Sales returns ----
    getSalesReturns: builder.query({
      query: (params = {}) => ({ url: "/sales-returns", params }),
      transformResponse: (response) => ({
        salesReturns:
          response?.salesReturns || (Array.isArray(response) ? response : []),
        pagination: response?.pagination,
      }),
      providesTags: (result) =>
        result?.salesReturns
          ? [
              ...result.salesReturns.map(({ id }) => ({
                type: "SalesReturn",
                id,
              })),
              { type: "SalesReturn", id: "LIST" },
            ]
          : [{ type: "SalesReturn", id: "LIST" }],
    }),
    getSalesReturn: builder.query({
      query: (id) => ({ url: `/sales-returns/${id}` }),
      transformResponse: (response) => ({
        salesReturn: response?.salesReturn ?? response,
        returnableItems: response?.returnableItems || null,
      }),
      providesTags: (result, error, id) => [{ type: "SalesReturn", id }],
    }),
    getSalesReturnable: builder.query({
      query: (invoiceId) => ({
        url: `/sales-returns/returnable/${invoiceId}`,
      }),
      providesTags: (result, error, invoiceId) => [
        { type: "SalesReturn", id: `RETURNABLE-${invoiceId}` },
        { type: "Invoice", id: invoiceId },
      ],
    }),
    createSalesReturn: builder.mutation({
      query: (body) => ({ url: "/sales-returns", method: "POST", data: body }),
      transformResponse: (response) => ({
        salesReturn: response?.salesReturn ?? response,
      }),
      invalidatesTags: (result, error, body) =>
        [
          { type: "SalesReturn", id: "LIST" },
          body?.invoiceId
            ? { type: "SalesReturn", id: `RETURNABLE-${body.invoiceId}` }
            : null,
          ...(body?.confirm
            ? [
                { type: "Invoice", id: body.invoiceId },
                { type: "Invoice", id: "LIST" },
                { type: "Product", id: "LIST" },
                { type: "Movement", id: "LIST" },
                "Client",
                "ClientLedger",
              ]
            : []),
        ].filter(Boolean),
    }),
    updateSalesReturn: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/sales-returns/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "SalesReturn", id },
        { type: "SalesReturn", id: "LIST" },
      ],
    }),
    confirmSalesReturn: builder.mutation({
      query: (id) => ({
        url: `/sales-returns/${id}/confirm`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SalesReturn", id },
        { type: "SalesReturn", id: "LIST" },
        { type: "Invoice", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
        "Client",
        "ClientLedger",
      ],
    }),
    cancelSalesReturn: builder.mutation({
      query: (id) => ({
        url: `/sales-returns/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SalesReturn", id },
        { type: "SalesReturn", id: "LIST" },
      ],
    }),

    // ---- Estimates ----
    getEstimates: builder.query({
      query: (params = {}) => ({ url: "/estimates", params }),
      transformResponse: (response) => ({
        estimates: response?.estimates || (Array.isArray(response) ? response : []),
        pagination: response?.pagination,
      }),
      providesTags: (result) =>
        result?.estimates
          ? [
              ...result.estimates.map(({ id }) => ({ type: "Estimate", id })),
              { type: "Estimate", id: "LIST" },
            ]
          : [{ type: "Estimate", id: "LIST" }],
    }),
    getEstimate: builder.query({
      query: (id) => ({ url: `/estimates/${id}` }),
      transformResponse: (response) => ({
        estimate: response?.estimate ?? response,
      }),
      providesTags: (result, error, id) => [{ type: "Estimate", id }],
    }),
    createEstimate: builder.mutation({
      query: (body) => ({ url: "/estimates", method: "POST", data: body }),
      transformResponse: (response) => ({
        estimate: response?.estimate ?? response,
      }),
      invalidatesTags: [{ type: "Estimate", id: "LIST" }],
    }),
    updateEstimate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/estimates/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Estimate", id },
        { type: "Estimate", id: "LIST" },
      ],
    }),
    convertEstimateToInvoice: builder.mutation({
      query: (id) => ({
        url: `/estimates/${id}/convert-to-invoice`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Estimate", id },
        { type: "Estimate", id: "LIST" },
        { type: "Invoice", id: "LIST" },
      ],
    }),
    deleteEstimate: builder.mutation({
      query: (id) => ({ url: `/estimates/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Estimate", id: "LIST" }],
    }),

    // ---- Suppliers ----
    getSuppliers: builder.query({
      query: (params = {}) => ({ url: "/suppliers", params }),
      transformResponse: normalizeSuppliersResponse,
      providesTags: (result) =>
        result?.suppliers
          ? [
              ...result.suppliers.map((s) => ({
                type: "Supplier",
                id: s.key || s.id,
              })),
              { type: "Supplier", id: "LIST" },
            ]
          : [{ type: "Supplier", id: "LIST" }],
    }),
    getSupplier: builder.query({
      query: (id) => ({ url: `/suppliers/${id}` }),
      transformResponse: (response) => ({
        supplier: normalizeSupplier(response?.supplier ?? response),
      }),
      providesTags: (result, error, id) => [{ type: "Supplier", id }],
    }),
    createSupplier: builder.mutation({
      query: (body) => ({ url: "/suppliers", method: "POST", data: body }),
      transformResponse: (response) => ({
        supplier: normalizeSupplier(response?.supplier ?? response),
      }),
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, _id, key, ...body }) => ({
        url: `/suppliers/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Supplier", id },
        { type: "Supplier", id: "LIST" },
      ],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),
    getSupplierLedger: builder.query({
      query: (id) => ({ url: `/suppliers/${id}/ledger` }),
      transformResponse: (response) => ({
        supplier: normalizeSupplier(response?.supplier),
        entries: response?.entries || [],
        summary: response?.summary,
      }),
      providesTags: (result, error, id) => [
        { type: "SupplierLedger", id },
        { type: "Supplier", id },
      ],
    }),
    getSupplierPayments: builder.query({
      query: (id) => ({ url: `/suppliers/${id}/payments` }),
      providesTags: (result, error, id) => [
        { type: "SupplierLedger", id: `PAYMENTS-${id}` },
      ],
    }),
    createSupplierPayment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/suppliers/${id}/payments`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Supplier", id },
        { type: "Supplier", id: "LIST" },
        { type: "SupplierLedger", id },
        { type: "SupplierLedger", id: `PAYMENTS-${id}` },
        { type: "Purchase", id: "LIST" },
      ],
    }),

    // ---- Purchases ----
    getPurchases: builder.query({
      query: (params = {}) => ({ url: "/purchases", params }),
      transformResponse: (response) => ({
        purchases: response?.purchases || (Array.isArray(response) ? response : []),
        pagination: response?.pagination,
      }),
      providesTags: (result) =>
        result?.purchases
          ? [
              ...result.purchases.map(({ id }) => ({ type: "Purchase", id })),
              { type: "Purchase", id: "LIST" },
            ]
          : [{ type: "Purchase", id: "LIST" }],
    }),
    getPurchase: builder.query({
      query: (id) => ({ url: `/purchases/${id}` }),
      transformResponse: (response) => ({
        purchase: response?.purchase ?? response,
      }),
      providesTags: (result, error, id) => [{ type: "Purchase", id }],
    }),
    createPurchase: builder.mutation({
      query: (body) => ({ url: "/purchases", method: "POST", data: body }),
      transformResponse: (response) => ({
        purchase: response?.purchase ?? response,
      }),
      invalidatesTags: [{ type: "Purchase", id: "LIST" }],
    }),
    updatePurchase: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/purchases/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
      ],
    }),
    confirmPurchase: builder.mutation({
      query: (id) => ({ url: `/purchases/${id}/confirm`, method: "POST" }),
      invalidatesTags: (result, error, id) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
        "Supplier",
        "SupplierLedger",
      ],
    }),
    cancelPurchase: builder.mutation({
      query: (id) => ({ url: `/purchases/${id}/cancel`, method: "POST" }),
      invalidatesTags: (result, error, id) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
      ],
    }),
    deletePurchase: builder.mutation({
      query: (id) => ({ url: `/purchases/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Purchase", id: "LIST" }],
    }),
    reversePurchase: builder.mutation({
      query: (id) => ({ url: `/purchases/${id}/reverse`, method: "POST" }),
      invalidatesTags: (result, error, id) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
        "Supplier",
        "SupplierLedger",
        { type: "PurchaseReturn", id: "LIST" },
      ],
    }),

    // ---- Purchase returns ----
    getPurchaseReturns: builder.query({
      query: (params = {}) => ({ url: "/purchase-returns", params }),
      transformResponse: (response) => ({
        purchaseReturns:
          response?.purchaseReturns ||
          (Array.isArray(response) ? response : []),
        pagination: response?.pagination,
      }),
      providesTags: (result) =>
        result?.purchaseReturns
          ? [
              ...result.purchaseReturns.map(({ id }) => ({
                type: "PurchaseReturn",
                id,
              })),
              { type: "PurchaseReturn", id: "LIST" },
            ]
          : [{ type: "PurchaseReturn", id: "LIST" }],
    }),
    getPurchaseReturn: builder.query({
      query: (id) => ({ url: `/purchase-returns/${id}` }),
      transformResponse: (response) => ({
        purchaseReturn: response?.purchaseReturn ?? response,
        returnableItems: response?.returnableItems || null,
      }),
      providesTags: (result, error, id) => [{ type: "PurchaseReturn", id }],
    }),
    getPurchaseReturnable: builder.query({
      query: (purchaseId) => ({
        url: `/purchase-returns/returnable/${purchaseId}`,
      }),
      providesTags: (result, error, purchaseId) => [
        { type: "PurchaseReturn", id: `RETURNABLE-${purchaseId}` },
        { type: "Purchase", id: purchaseId },
      ],
    }),
    createPurchaseReturn: builder.mutation({
      query: (body) => ({
        url: "/purchase-returns",
        method: "POST",
        data: body,
      }),
      transformResponse: (response) => ({
        purchaseReturn: response?.purchaseReturn ?? response,
      }),
      invalidatesTags: (result, error, body) =>
        [
          { type: "PurchaseReturn", id: "LIST" },
          body?.purchaseId
            ? { type: "PurchaseReturn", id: `RETURNABLE-${body.purchaseId}` }
            : null,
          ...(body?.confirm
            ? [
                { type: "Purchase", id: body.purchaseId },
                { type: "Purchase", id: "LIST" },
                { type: "Product", id: "LIST" },
                { type: "Movement", id: "LIST" },
                "Supplier",
                "SupplierLedger",
              ]
            : []),
        ].filter(Boolean),
    }),
    updatePurchaseReturn: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/purchase-returns/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PurchaseReturn", id },
        { type: "PurchaseReturn", id: "LIST" },
      ],
    }),
    confirmPurchaseReturn: builder.mutation({
      query: (id) => ({
        url: `/purchase-returns/${id}/confirm`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PurchaseReturn", id },
        { type: "PurchaseReturn", id: "LIST" },
        { type: "Purchase", id: "LIST" },
        { type: "Product", id: "LIST" },
        { type: "Movement", id: "LIST" },
        "Supplier",
        "SupplierLedger",
      ],
    }),
    cancelPurchaseReturn: builder.mutation({
      query: (id) => ({
        url: `/purchase-returns/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "PurchaseReturn", id },
        { type: "PurchaseReturn", id: "LIST" },
      ],
    }),

    // ---- Expense categories ----
    getExpenseCategories: builder.query({
      query: (params = {}) => ({ url: "/expense-categories", params }),
      transformResponse: (response) => ({
        categories:
          response?.categories || (Array.isArray(response) ? response : []),
      }),
      providesTags: (result) =>
        result?.categories
          ? [
              ...result.categories.map(({ id }) => ({
                type: "ExpenseCategory",
                id,
              })),
              { type: "ExpenseCategory", id: "LIST" },
            ]
          : [{ type: "ExpenseCategory", id: "LIST" }],
    }),
    createExpenseCategory: builder.mutation({
      query: (body) => ({
        url: "/expense-categories",
        method: "POST",
        data: body,
      }),
      transformResponse: (response) => ({
        category: response?.category ?? response,
      }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),
    updateExpenseCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/expense-categories/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ExpenseCategory", id },
        { type: "ExpenseCategory", id: "LIST" },
      ],
    }),
    deleteExpenseCategory: builder.mutation({
      query: (id) => ({ url: `/expense-categories/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    // ---- Expenses ----
    getExpenses: builder.query({
      query: (params = {}) => ({ url: "/expenses", params }),
      transformResponse: (response) => ({
        expenses:
          response?.expenses || (Array.isArray(response) ? response : []),
        summary: response?.summary || { totalAmount: 0 },
        pagination: response?.pagination,
      }),
      providesTags: (result) =>
        result?.expenses
          ? [
              ...result.expenses.map(({ id }) => ({ type: "Expense", id })),
              { type: "Expense", id: "LIST" },
            ]
          : [{ type: "Expense", id: "LIST" }],
    }),
    getExpense: builder.query({
      query: (id) => ({ url: `/expenses/${id}` }),
      transformResponse: (response) => ({
        expense: response?.expense ?? response,
      }),
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),
    createExpense: builder.mutation({
      query: (body) => ({ url: "/expenses", method: "POST", data: body }),
      transformResponse: (response) => ({
        expense: response?.expense ?? response,
      }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/expenses/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({ url: `/expenses/${id}`, method: "DELETE" }),
      invalidatesTags: (result, error, id) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery,
  useSwitchBusinessMutation,
  useGetUsersQuery,
  useInviteUserMutation,
  useUpdateUserMutation,
  useRemoveUserMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPlatformBusinessesQuery,
  useCreatePlatformBusinessMutation,
  useUpdatePlatformBusinessMutation,
  useGetAuditLogsQuery,
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetClientLedgerQuery,
  useGetClientPaymentsQuery,
  useCreateClientPaymentMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetMovementsQuery,
  useGetLowStockQuery,
  useAdjustInventoryMutation,
  useOpeningStockMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
  useConfirmInvoiceMutation,
  useDeleteInvoiceMutation,
  useReverseInvoiceMutation,
  useGetSalesReturnsQuery,
  useGetSalesReturnQuery,
  useGetSalesReturnableQuery,
  useCreateSalesReturnMutation,
  useUpdateSalesReturnMutation,
  useConfirmSalesReturnMutation,
  useCancelSalesReturnMutation,
  useGetEstimatesQuery,
  useGetEstimateQuery,
  useCreateEstimateMutation,
  useUpdateEstimateMutation,
  useConvertEstimateToInvoiceMutation,
  useDeleteEstimateMutation,
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierLedgerQuery,
  useGetSupplierPaymentsQuery,
  useCreateSupplierPaymentMutation,
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useConfirmPurchaseMutation,
  useCancelPurchaseMutation,
  useDeletePurchaseMutation,
  useReversePurchaseMutation,
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnQuery,
  useGetPurchaseReturnableQuery,
  useCreatePurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useConfirmPurchaseReturnMutation,
  useCancelPurchaseReturnMutation,
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = invoiceApi;
