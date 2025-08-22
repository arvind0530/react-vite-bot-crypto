// src/utils/delta.js
import CryptoJS from 'crypto-js';

export const BASE_PROD = 'https://api.india.delta.exchange';
export const BASE_TEST = 'https://cdn-ind.testnet.deltaex.org';
export const WS_PROD = 'wss://socket.india.delta.exchange';
export const WS_TEST = 'wss://socket-ind.testnet.deltaex.org';

/**
 * Generate signature and timestamp
 * signature_data = method + timestamp + path + queryString + payload
 * (timestamp = seconds since epoch)
 */
export function generateSignature(apiSecret, method, path, queryString = '', payload = '') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signatureData = method + timestamp + path + queryString + payload;
  const signature = CryptoJS.HmacSHA256(signatureData, apiSecret).toString(CryptoJS.enc.Hex);
  return { signature, timestamp };
}

/**
 * Fetch products (public)
 */
export async function fetchProducts(useTest = false) {
  const base = useTest ? BASE_TEST : BASE_PROD;
  const res = await fetch(`${base}/v2/products?page_size=500`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Products fetch failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  // docs return { success, result } sometimes; handle either
  return json.result ?? json;
}

/**
 * Place a market buy order directly from client (dev only).
 * It finds product_id by symbol and submits POST /v2/orders with signature headers.
 */
export async function placeMarketBuyDirect({
  apiKey,
  apiSecret,
  symbol = 'BTCUSD_PERP',
  size = 1,
  useTest = false
}) {
  if (!apiKey || !apiSecret) throw new Error('Missing API credentials');

  const base = useTest ? BASE_TEST : BASE_PROD;

  // 1) get products to find product_id
  const products = await fetchProducts(useTest);
  const prod = products.find(p => p.symbol === symbol);
  if (!prod) throw new Error(`Product not found for symbol ${symbol}`);

  const path = '/v2/orders';
  const method = 'POST';

  // payload fields accepted by Delta: include product_id for safety
  const payloadObj = {
    product_id: prod.id,
    product_symbol: symbol,
    size,
    side: 'buy',
    order_type: 'market_order'
  };
  const payload = JSON.stringify(payloadObj);

  // 2) sign
  const { signature, timestamp } = generateSignature(apiSecret, method, path, '', payload);

  // 3) send
  const resp = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      signature,
      timestamp
    },
    body: payload
  });

  const data = await resp.json();
  if (!resp.ok) {
    // include response body for debugging
    throw new Error(`Order failed: ${resp.status} ${JSON.stringify(data)}`);
  }
  return data;
}
