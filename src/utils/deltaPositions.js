// src/utils/delta.js
async function signMessage(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getPositionsDirect({ apiKey, apiSecret, useTest }) {
  const base = useTest
    ? 'https://api.testnet.delta.exchange'
    : 'https://api.delta.exchange';

  const path = '/v2/positions/margined';
  const timestamp = Date.now();
  const method = 'GET';
  const body = '';

  const signaturePayload = `${timestamp}${method}${path}${body}`;
  const signature = await signMessage(apiSecret, signaturePayload);

  const res = await fetch(base + path, {
    method: 'GET',
    headers: {
      'api-key': apiKey,
      'timestamp': timestamp,
      'signature': signature,
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  return data.result || [];
}


// Example structure for closePositionDirect
export const closePositionDirect = async ({ apiKey, apiSecret, useTest, productId, size, orderType, price }) => {
  const baseUrl = useTest 
    ? 'https://cdn-ind.testnet.deltaex.org' 
    : 'https://api.india.delta.exchange';
  
  const method = 'POST';
  const path = '/v2/orders';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Determine the side (opposite of current position)
  const side = parseFloat(size) > 0 ? 'sell' : 'buy';
  const orderSize = Math.abs(parseFloat(size));
  
  const payload = {
    product_id: productId,
    size: orderSize,
    side: side,
    order_type: orderType === 'limit' ? 'limit_order' : 'market_order',
    reduce_only: 'true', // Important: This ensures it only closes positions
    ...(orderType === 'limit' && price && { limit_price: price })
  };
  
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(apiSecret, method + timestamp + path + '' + payloadString);
  
  const response = await fetch(`${baseUrl}${path}`, {
    method: method,
    headers: {
      'api-key': apiKey,
      'timestamp': timestamp,
      'signature': signature,
      'User-Agent': 'javascript-client',
      'Content-Type': 'application/json'
    },
    body: payloadString
  });
  
  return await response.json();
};
