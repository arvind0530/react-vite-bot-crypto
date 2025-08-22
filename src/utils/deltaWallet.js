// utils/deltaWallet.js
import crypto from 'crypto';

export async function getWalletBalances({ apiKey, apiSecret, useTest = false }) {
  const baseUrl = useTest
    ? 'https://api.testnet.delta.exchange'
    : 'https://api.delta.exchange';

  const path = '/v2/wallet/balances';
  const method = 'GET';
  const timestamp = Date.now().toString();

  const prehash = `${timestamp}${method}${path}`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(prehash)
    .digest('hex');

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      'timestamp': timestamp,
      'signature': signature
    }
  });

  if (!res.ok) {
    throw new Error(`Wallet fetch failed: ${res.status}`);
  }

  const data = await res.json();
  return data.result || [];
}
