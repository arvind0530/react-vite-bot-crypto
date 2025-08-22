import CryptoJS from "crypto-js";

export async function getOrdersDirect({ apiKey, apiSecret, useTest = false, limit = 10 }) {
  const baseUrl = useTest
    ? "https://api.testnet.delta.exchange"
    : "https://api.delta.exchange";

  const method = "GET";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = `/v2/orders`;
  const queryString = `?page_size=${limit}`;
  const payload = "";

  const signatureData = method + timestamp + path + queryString + payload;
  const signature = CryptoJS.HmacSHA256(signatureData, apiSecret).toString();

  const res = await fetch(`${baseUrl}${path}${queryString}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      "timestamp": timestamp,
      "signature": signature
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Order fetch failed: ${errorText}`);
  }
  return await res.json();
}

export const editOrderDirect = async ({ apiKey, apiSecret, useTest, orderId, price, size }) => {
  // Implementation for editing orders
};
export const cancelOrderDirect = async ({ apiKey, apiSecret, useTest, orderId }) => {
  // Implementation for cancelling orders
};
