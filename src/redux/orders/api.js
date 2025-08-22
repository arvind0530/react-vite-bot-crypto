// src/redux/ordersApi.js
import { apiSlice } from "../api";

// Helper to keep paths exact (used in signing)
const ORDERS_BASE = "/orders";

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /orders?state=&product_symbol=&limit=&page=
    getOrders: builder.query({
      query: ({ state, product_symbol, limit = 50, page = 1 } = {}) => ({
        url: ORDERS_BASE,
        method: "GET",
        params: { state, product_symbol, limit, page },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((o) => ({ type: "Orders", id: o.id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
      // if your API returns array directly, change result?.data -> result
      transformResponse: (res) => res, // keep as-is
    }),

    // PATCH /orders/:id  (edit price/size)
    editOrder: builder.mutation({
      query: ({ id, price, size }) => ({
        url: `${ORDERS_BASE}/${id}`,
        method: "PATCH",
        body: { price, size },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Orders", id: arg.id },
        { type: "Orders", id: "LIST" },
      ],
    }),

    // DELETE /orders/:id (cancel)
    cancelOrder: builder.mutation({
      query: ({ id }) => ({
        url: `${ORDERS_BASE}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Orders", id: arg.id },
        { type: "Orders", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useEditOrderMutation,
  useCancelOrderMutation,
} = ordersApi;
