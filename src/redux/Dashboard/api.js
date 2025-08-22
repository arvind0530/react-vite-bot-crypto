import { apiSlice } from "../api";

export const customApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getOrders: builder.query({
      query: () => {
        const path = "/v2/orders";
        const queryString = "?product_id=1&state=open";

        return {
          url: `${path}${queryString}`,
          method: "GET",
          extra: {
            method: "GET",
            path,
            queryString,
            body: "",
          },
        };
      },
    }),
    createOrder: builder.mutation({
      query: orderData => {
        const path = "/v2/orders";
        return {
          url: path,
          method: "POST",
          body: orderData,
          extra: {
            method: "POST",
            path,
            queryString: "",
            body: orderData,
          },
        };
      },
    }),
  }),
});

export const { useGetOrdersQuery, useCreateOrderMutation } = customApiSlice;
