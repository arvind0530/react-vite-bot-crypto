import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "../config.js";
import CryptoJS from "crypto-js"; // npm install crypto-js

// ==============================
//  CONFIG (Replace with your keys)
// ==============================
const API_KEY = "YOUR_API_KEY"; 
const API_SECRET = "YOUR_SECRET_KEY"; // keep this safe
const USER_AGENT = "javascript-rtk-query"; // change as needed

// =============
// SIGN FUNCTION
// =============
const generateSignature = (method, timestamp, path, queryString = "", body = "") => {
  // Build the prehash string
  const prehash = `${method.toUpperCase()}${timestamp}${path}${queryString}${body}`;
  // Create HMAC SHA256
  return CryptoJS.HmacSHA256(prehash, API_SECRET).toString(CryptoJS.enc.Hex);
};

const baseQuery = fetchBaseQuery({
  baseUrl: config.API_URL,
  withCredentials: true,
  credentials: "same-origin",
  prepareHeaders: (headers, { getState, endpoint, type, forced, extra }) => {
    const method = extra?.method || "GET"; // fallback to GET if unknown
    const path = extra?.path || "/"; // API path (must match exactly what you send in query.url)
    const queryString = extra?.queryString || ""; // e.g. "?product_id=1&state=open"
    const body = extra?.body ? JSON.stringify(extra.body) : "";

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateSignature(method, timestamp, path, queryString, body);

    headers.set("api-key", API_KEY);
    headers.set("signature", signature);
    headers.set("timestamp", timestamp);
    headers.set("User-Agent", USER_AGENT);

    // Always send JSON
    headers.set("Content-Type", "application/json");

    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: builder => ({}),
});
