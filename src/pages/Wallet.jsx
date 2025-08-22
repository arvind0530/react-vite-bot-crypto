import React, { useEffect, useState } from 'react';
import { getWalletBalances } from '../utils/deltaWallet';

export default function Wallet() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiKey = localStorage.getItem('delta_apiKey');
    const apiSecret = localStorage.getItem('delta_apiSecret');
    const useTest = localStorage.getItem('delta_useTest') === 'true';

    if (!apiKey || !apiSecret) {
      setError('Missing API credentials. Please login first.');
      setLoading(false);
      return;
    }

    getWalletBalances({ apiKey, apiSecret, useTest })
      .then((data) => {
        setBalances(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch balances.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading balances...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Wallet Balances</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Currency</th>
            <th>Available Margin</th>
            <th>Total Balance</th>
            <th>Unrealized PnL</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((b, i) => (
            <tr key={i}>
              <td>{b.asset_symbol}</td>
              <td>{b.available_margin}</td>
              <td>{b.balance}</td>
              <td>{b.unrealized_pnl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
