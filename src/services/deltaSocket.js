// src/services/deltaSocket.js
import CryptoJS from "crypto-js";

// ==============================
// CONFIG (replace with your keys)
// ==============================
const WS_URL = "wss://socket.india.delta.exchange"; // Production
// const WS_URL = "wss://socket-ind.testnet.deltaex.org"; // Testnet
const API_KEY = "8kBQujfUZi0S6Jmkqbk60WFGp88RRO";
const API_SECRET = "rgZyCGMfH7oLeGHZZcCrSEUAVYpBeaqQupm20If4B5wXn8gSEcYh1YK94QPg";

// ==============================
// FUNCTION: Generate Signature
// ==============================
function generateSignature(method, timestamp, path) {
  const prehash = `${method}${timestamp}${path}`;
  return CryptoJS.HmacSHA256(prehash, API_SECRET).toString(CryptoJS.enc.Hex);
}

// ==============================
// FUNCTION: INIT WEBSOCKET
// ==============================
export function initDeltaSocket({ symbols = ["BTCUSDT-PERP"], onPriceUpdate }) {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("✅ Connected to Delta WebSocket");

    // AUTHENTICATE
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateSignature("GET", timestamp, "/live");

    ws.send(JSON.stringify({
      type: "auth",
      api_key: API_KEY,
      signature,
      timestamp
    }));

    console.log("🔐 Auth message sent");

    // SUBSCRIBE TO PRICE FEED
    ws.send(JSON.stringify({
      type: "subscribe",
      payload: {
        channels: [
          {
            name: "v2/ticker",
            symbols
          }
        ]
      }
    }));

    console.log(`📡 Subscribed to ${symbols.join(", ")} ticker feed`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "v2/ticker" && onPriceUpdate) {
        onPriceUpdate({
          symbol: data.symbol,
          price: data.mark_price
        });
      }
    } catch (err) {
      console.error("❌ Error parsing WS message:", err);
    }
  };

  ws.onerror = (err) => {
    console.error("🚨 WebSocket Error:", err);
  };

  ws.onclose = () => {
    console.log("❌ WebSocket closed");
  };

  return ws;
}
