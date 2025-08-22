// src/pages/CryptoChart.jsx
import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

const CryptoChart = () => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const [symbol, setSymbol] = useState("BTCUSDT");

  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];

  useEffect(() => {
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: "#131722" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#2B2B43" },
        horzLines: { color: "#2B2B43" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    fetchData(symbol);

    const handleResize = () => {
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current.remove();
    };
  }, []);

  useEffect(() => {
    fetchData(symbol);
  }, [symbol]);

  const fetchData = async (pair) => {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1h&limit=100`
    );
    const data = await res.json();

    const formattedData = data.map((d) => ({
      time: d[0] / 1000,
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
    }));

    seriesRef.current.setData(formattedData);
  };

  return (
    <div style={{ padding: "1rem", background: "#0d1117", minHeight: "100vh" }}>
      <h2 style={{ color: "white", textAlign: "center" }}>Crypto Trading Analysis</h2>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "10px" }}>
        {symbols.map((sym) => (
          <button
            key={sym}
            onClick={() => setSymbol(sym)}
            style={{
              padding: "8px 12px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              background: symbol === sym ? "#1f6feb" : "#30363d",
              color: "white",
            }}
          >
            {sym.replace("USDT", "/USDT")}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} style={{ width: "100%", height: "500px" }} />
    </div>
  );
};

export default CryptoChart;
