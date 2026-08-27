import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const clientApi = createApi({
  reducerPath: "clientApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:5000/",
  }),
  tagTypes: ["Client"],
  endpoints: (builder) => ({
    getClients: builder.query({
      query: () => "clients",
      providesTags: ["Client"],
    }),
    getClient: builder.query({
      query: (id) => `clients/${id}`,
      providesTags: (result, error, id) => [{ type: "Client", id }],
    }),
    createClient: builder.mutation({
      query: (body) => ({
        url: "clients",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Client"],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `clients/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Client"],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `clients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Client"],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;
