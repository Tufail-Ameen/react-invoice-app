import { createApi } from "@reduxjs/toolkit/query/react";
import { normalizeClient, normalizeClientsResponse } from "../lib/normalizeClient";
import { normalizeProductsResponse } from "../lib/normalizeProduct";
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
    "Movement",
    "Invoice",
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
      invalidatesTags: ["Auth", "Client", "Product", "Invoice", "Movement", "User"],
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

    // ---- Products (GET /products → raw array from Express) ----
    getProducts: builder.query({
      query: () => ({ url: "/products" }),
      transformResponse: normalizeProductsResponse,
      providesTags: (result) =>
        result?.products
          ? [
              ...result.products.map(({ id }) => ({ type: "Product", id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
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

    // ---- Inventory ----
    getMovements: builder.query({
      query: (params = {}) => ({ url: "/inventory/movements", params }),
      providesTags: [{ type: "Movement", id: "LIST" }],
    }),
    adjustInventory: builder.mutation({
      query: (body) => ({ url: "/inventory/adjust", method: "POST", data: body }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
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
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetMovementsQuery,
  useAdjustInventoryMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
  useDeleteInvoiceMutation,
} = invoiceApi;
