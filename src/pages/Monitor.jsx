import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { WS_PROD, WS_TEST, placeMarketBuyDirect } from '../utils/delta';

export default function Monitor() {
  const { symbol } = useParams();
  const [targetPrice, setTargetPrice] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [orderExecuted, setOrderExecuted] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const addLog = (msg, type = 'info') => {
    setLogs(l => [{ time: new Date().toLocaleTimeString(), msg, type }, ...l].slice(0, 30));
  };

  useEffect(() => {
    const useTest = localStorage.getItem('delta_useTest') === 'true';
    const wsUrl = useTest ? WS_TEST : WS_PROD;
    let ws;

    function connect() {
      addLog(`Connecting to ${wsUrl}`, 'info');
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addLog('WS open', 'info');
        // subscribe to v2/ticker
        const subscribe = {
          type: 'subscribe',
          payload: {
            channels: [{ name: 'v2/ticker', symbols: [symbol] }]
          }
        };
        ws.send(JSON.stringify(subscribe));
        addLog('Subscribed to ticker ' + symbol, 'info');
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          // msg format for v2/ticker contains mark_price
          const priceRaw = msg.mark_price ?? msg.close ?? msg.best_ask ?? msg.best_bid ?? null;
          if (priceRaw != null) {
            const price = Number(priceRaw);
            setCurrentPrice(price);
            if (!orderExecuted && price >= Number(targetPrice)) {
              addLog(`Target reached: ${price} >= ${targetPrice}`, 'success');
              triggerBuy();
            }
          } else {
            // keep minimal logs for other messages
          }
        } catch (err) {
          console.warn('ws parse err', err);
        }
      };

      ws.onclose = (e) => {
        setIsConnected(false);
        addLog('WS closed, will reconnect in 3s', 'warn');
        // reconnect after short delay
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WS error', err);
        ws.close();
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, targetPrice, orderExecuted]);

  const triggerBuy = async () => {
    const apiKey = localStorage.getItem('delta_apiKey');
    const apiSecret = localStorage.getItem('delta_apiSecret');
    const useTest = localStorage.getItem('delta_useTest') === 'true';

    if (!apiKey || !apiSecret) {
      addLog('Missing API credentials. Save them on Login page.', 'error');
      return;
    }

    addLog(`Placing market buy for ${quantity} ${symbol}`, 'info');
    try {
      setOrderExecuted(true);
      const res = await placeMarketBuyDirect({
        apiKey,
        apiSecret,
        symbol,
        size: Number(quantity),
        useTest
      });
      addLog('Order response: ' + JSON.stringify(res), 'success');
    } catch (err) {
      addLog('Order failed: ' + (err.message || err), 'error');
      setOrderExecuted(false); // allow retry if wanted
    }
  };

  return (
    <div>
      <h2>Monitor {symbol}</h2>
      <div>
        WS: {isConnected ? <b style={{color:'green'}}>Connected</b> : <b style={{color:'red'}}>Disconnected</b>}
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Current:</strong> {currentPrice ?? '—'}
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Target price: <input value={targetPrice} onChange={e => setTargetPrice(e.target.value)} /></label>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>Quantity: <input value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={triggerBuy} disabled={orderExecuted}>Force Buy Now</button>
        <button onClick={() => { setOrderExecuted(false); addLog('Manual reset executed state', 'info'); }} style={{ marginLeft: 8 }}>Reset Execution</button>
      </div>

      <h3 style={{ marginTop: 18 }}>Logs</h3>
      <div style={{ maxHeight: 300, overflow: 'auto', background: '#fafafa', padding: 8 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <small style={{ color: '#888' }}>{l.time}</small>{' '}
            <span style={{ color: l.type === 'error' ? 'crimson' : l.type === 'success' ? 'green' : '#333' }}>
              {l.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
