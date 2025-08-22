// src/services/priceSocket.js
export function initPriceSocket({ symbols, onPriceUpdate }) {
  const ws = new WebSocket(`wss://your-delta-socket-url`); // Replace with your endpoint

  ws.onopen = () => {
    console.log("✅ Socket connected");
    // Subscribe to price updates
    ws.send(JSON.stringify({ type: "subscribe", symbols }));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "price_update" && symbols.includes(msg.symbol)) {
        onPriceUpdate({ symbol: msg.symbol, price: msg.price });
      }
    } catch (error) {
      console.error("Socket message error:", error);
    }
  };

  ws.onclose = () => {
    console.log("❌ Socket closed");
  };

  return ws;
}
