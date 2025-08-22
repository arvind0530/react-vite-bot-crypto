
// BtcLive.jsx
import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { initDeltaSocket } from "../services/deltaSocket";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function BtcLive() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "BTCUSD Price",
        data: [],
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13, 110, 253, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  });

  const chartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const symbol = "BTCUSD";

  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [totalPnL, setTotalPnL] = useState(0);

  // Auto trading states
  const [autoTrading, setAutoTrading] = useState(false);
  const [nextBuyTime, setNextBuyTime] = useState(null);
  const [nextClearTime, setNextClearTime] = useState(null);
  const [tradingStats, setTradingStats] = useState({
    autoTrades: 0,
    profitableTrades: 0,
    autoTradingStartTime: null
  });

  // Refs for timers
  const buyTimerRef = useRef(null);
  const sellTimersRef = useRef(new Map());
  const clearTimerRef = useRef(null);

  // Load stored positions and auto trading state
  useEffect(() => {
    const savedOpen = JSON.parse(localStorage.getItem("openPositions") || "[]");
    const savedClosed = JSON.parse(localStorage.getItem("closedPositions") || "[]");
    const savedAutoTrading = JSON.parse(localStorage.getItem("autoTrading") || "false");
    const savedStats = JSON.parse(localStorage.getItem("tradingStats") || "{}");

    setOpenPositions(savedOpen);
    setClosedPositions(savedClosed);
    setAutoTrading(savedAutoTrading);
    setTradingStats({
      autoTrades: 0,
      profitableTrades: 0,
      autoTradingStartTime: null,
      ...savedStats
    });

    // Resume auto trading if it was active
    if (savedAutoTrading) {
      startAutoTrading();
    }
  }, []);

  // Calculate total PnL whenever closed positions change
  useEffect(() => {
    const total = closedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const profitable = closedPositions.filter(pos => pos.pnl > 0).length;
    setTotalPnL(total);
    setTradingStats(prev => ({
      ...prev,
      profitableTrades: profitable
    }));
  }, [closedPositions]);

  // Price updates from socket
  useEffect(() => {
    const ws = initDeltaSocket({
      symbols: [symbol],
      onPriceUpdate: (data) => {
        setCurrentPrice(data.price);
        setChartData((prev) => {
          const newLabels = [...prev.labels, new Date().toLocaleTimeString()].slice(-50);
          const newData = [...prev.datasets[0].data, data.price].slice(-50);
          return {
            ...prev,
            labels: newLabels,
            datasets: [{ ...prev.datasets[0], data: newData }],
          };
        });
        setLoading(false);
      },
    });
    return () => ws.close();
  }, []);

  // Save to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem("openPositions", JSON.stringify(openPositions));
    localStorage.setItem("closedPositions", JSON.stringify(closedPositions));
    localStorage.setItem("autoTrading", JSON.stringify(autoTrading));
    localStorage.setItem("tradingStats", JSON.stringify(tradingStats));
  }, [openPositions, closedPositions, autoTrading, tradingStats]);

  // Auto buy every 5 minutes
  const startAutoBuy = () => {
    const executeBuy = () => {
      if (!currentPrice || !autoTrading) return;

      const newPosition = {
        id: Date.now(),
        symbol,
        buyPrice: Number(currentPrice),
        sellPrice: null,
        quantity: Number(quantity),
        side: Math.random() > 0.5 ? "LONG" : "SHORT", // Random side for auto trading
        time: new Date().toISOString(),
        isAutoTrade: true
      };

      setOpenPositions((prev) => [...prev, newPosition]);
      setTradingStats(prev => ({
        ...prev,
        autoTrades: prev.autoTrades + 1
      }));

      // Set sell timer for 1 minute
      const sellTimer = setTimeout(() => {
        handleAutoClose(newPosition.id);
        sellTimersRef.current.delete(newPosition.id);
      }, 60000); // 1 minute

      sellTimersRef.current.set(newPosition.id, sellTimer);

      console.log(`Auto ${newPosition.side} position opened at $${currentPrice}`);
    };

    // Execute first buy immediately
    executeBuy();

    // Set interval for subsequent buys
    buyTimerRef.current = setInterval(() => {
      executeBuy();
      setNextBuyTime(new Date(Date.now() + 5 * 60 * 1000)); // Next buy in 5 minutes
    }, 5 * 60 * 1000); // 5 minutes

    setNextBuyTime(new Date(Date.now() + 5 * 60 * 1000));
  };

  // Auto close position
  const handleAutoClose = (id) => {
    const pos = openPositions.find((p) => p.id === id);
    if (!pos || !currentPrice) return;

    let pnl = pos.side === "LONG"
      ? (currentPrice - pos.buyPrice) * pos.quantity
      : (pos.buyPrice - currentPrice) * pos.quantity;

    const closed = {
      ...pos,
      sellPrice: Number(currentPrice),
      sellTime: new Date().toISOString(),
      pnl,
    };

    setClosedPositions((prev) => [...prev, closed]);
    setOpenPositions((prev) => prev.filter((p) => p.id !== id));

    console.log(`Auto position closed. PnL: $${pnl.toFixed(2)}`);
  };

  // Clear all positions every 3 hours
  const startAutoClear = () => {
    clearTimerRef.current = setInterval(() => {
      // Close all open positions first
      openPositions.forEach(pos => {
        if (sellTimersRef.current.has(pos.id)) {
          clearTimeout(sellTimersRef.current.get(pos.id));
          sellTimersRef.current.delete(pos.id);
        }
        handleAutoClose(pos.id);
      });

      // Clear history after 5 seconds
      setTimeout(() => {
        setClosedPositions([]);
        localStorage.removeItem("closedPositions");
        console.log("Auto cleared all positions and history");
      }, 5000);

      setNextClearTime(new Date(Date.now() + 3 * 60 * 60 * 1000)); // Next clear in 3 hours
    }, 3 * 60 * 60 * 1000); // 3 hours

    setNextClearTime(new Date(Date.now() + 3 * 60 * 60 * 1000));
  };

  // Start auto trading
  const startAutoTrading = () => {
    setAutoTrading(true);
    setTradingStats(prev => ({
      ...prev,
      autoTradingStartTime: new Date().toISOString()
    }));
    startAutoBuy();
    startAutoClear();
  };

  // Stop auto trading
  const stopAutoTrading = () => {
    setAutoTrading(false);

    // Clear all timers
    if (buyTimerRef.current) {
      clearInterval(buyTimerRef.current);
      buyTimerRef.current = null;
    }

    if (clearTimerRef.current) {
      clearInterval(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    // Clear all sell timers
    sellTimersRef.current.forEach(timer => clearTimeout(timer));
    sellTimersRef.current.clear();

    setNextBuyTime(null);
    setNextClearTime(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoTrading();
    };
  }, []);

  // Manual Open Long
  const handleBuy = () => {
    if (!currentPrice || quantity <= 0) return;
    const newPosition = {
      id: Date.now(),
      symbol,
      buyPrice: Number(currentPrice),
      sellPrice: null,
      quantity: Number(quantity),
      side: "LONG",
      time: new Date().toISOString(),
      isAutoTrade: false
    };
    setOpenPositions((prev) => [...prev, newPosition]);
  };

  // Manual Open Short
  const handleShortSell = () => {
    if (!currentPrice || quantity <= 0) return;
    const newPosition = {
      id: Date.now(),
      symbol,
      buyPrice: Number(currentPrice),
      sellPrice: null,
      quantity: Number(quantity),
      side: "SHORT",
      time: new Date().toISOString(),
      isAutoTrade: false
    };
    setOpenPositions((prev) => [...prev, newPosition]);
  };

  // Manual Close Position
  const handleClose = (id) => {
    const pos = openPositions.find((p) => p.id === id);
    if (!pos) return;

    // Clear auto sell timer if exists
    if (sellTimersRef.current.has(id)) {
      clearTimeout(sellTimersRef.current.get(id));
      sellTimersRef.current.delete(id);
    }

    let pnl = pos.side === "LONG"
      ? (currentPrice - pos.buyPrice) * pos.quantity
      : (pos.buyPrice - currentPrice) * pos.quantity;

    const closed = {
      ...pos,
      sellPrice: Number(currentPrice),
      sellTime: new Date().toISOString(),
      pnl,
    };

    setClosedPositions((prev) => [...prev, closed]);
    setOpenPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const clearHistory = () => {
    setClosedPositions([]);
    localStorage.removeItem("closedPositions");
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    return new Date(time).toLocaleTimeString();
  };

  const getWinRate = () => {
    if (closedPositions.length === 0) return 0;
    const profitable = closedPositions.filter(pos => pos.pnl > 0).length;
    return ((profitable / closedPositions.length) * 100).toFixed(1);
  };

  return (
    <div className="container-fluid py-3">
      {/* Enhanced Header with Auto Trading Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-dark text-white shadow-lg border-0">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-lg-3">
                  <h4 className="mb-0">
                    <i className="fas fa-chart-line me-2"></i>
                    Live BTCUSD Bot
                  </h4>
                  <small className="text-muted">Advanced Auto Trading</small>
                </div>
                <div className="col-lg-6">
                  <div className="row text-center">
                    <div className="col-6 col-md-3">
                      <div className="border-end border-secondary">
                        <h6 className="mb-0 text-info">{closedPositions.length}</h6>
                        <small>Total Trades</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border-end border-secondary">
                        <h6 className={`mb-0 ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                          ${totalPnL.toFixed(2)}
                        </h6>
                        <small>Total PnL</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border-end border-secondary">
                        <h6 className="mb-0 text-warning">{getWinRate()}%</h6>
                        <small>Win Rate</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <h6 className="mb-0 text-primary">{tradingStats.autoTrades}</h6>
                      <small>Auto Trades</small>
                    </div>
                  </div>
                </div>
                {/* <div className="col-lg-3 text-end">
                  <div className="d-flex flex-column gap-2">
                    <button
                      className={`btn ${autoTrading ? 'btn-danger' : 'btn-success'} btn-sm`}
                      onClick={autoTrading ? stopAutoTrading : startAutoTrading}
                    >
                      <i className={`fas ${autoTrading ? 'fa-stop' : 'fa-play'} me-1`}></i>
                      {autoTrading ? 'Stop Auto Trading' : 'Start Auto Trading'}
                    </button>
                    <div className="text-center">
                      <span className={`badge ${autoTrading ? 'bg-success' : 'bg-secondary'}`}>
                        {autoTrading ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Trading Status */}
      {autoTrading && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-info border-0 shadow-sm">
              <div className="row text-center">
                <div className="col-md-4">
                  <i className="fas fa-clock me-2"></i>
                  <strong>Next Buy:</strong> {formatTime(nextBuyTime)}
                </div>
                <div className="col-md-4">
                  <i className="fas fa-broom me-2"></i>
                  <strong>Next Clear:</strong> {formatTime(nextClearTime)}
                </div>
                <div className="col-md-4">
                  <i className="fas fa-robot me-2"></i>
                  <strong>Auto Mode:</strong> Buy every 5min, Sell after 1min
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Price Display */}
      {currentPrice && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-3">
                <h2 className="mb-0 text-primary">
                  <i className="fab fa-bitcoin me-2"></i>
                  ${Number(currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <small className="text-muted">Current BTC/USD Price</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
              <div className="text-center">
                <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5>Connecting to live data...</h5>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="fas fa-chart-area me-2"></i>
                    Live Price Chart
                  </h5>
                </div>
                <div className="card-body p-2">
                  <div style={{ height: "400px" }}>
                    <Line
                      ref={chartRef}
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            labels: { color: "#333", font: { size: 14 } }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: 'white',
                            bodyColor: 'white'
                          }
                        },
                        scales: {
                          x: {
                            grid: { color: 'rgba(0,0,0,0.1)' },
                            ticks: { color: "#555", maxTicksLimit: 10 }
                          },
                          y: {
                            grid: { color: 'rgba(0,0,0,0.1)' },
                            ticks: { color: "#555" }
                          }
                        },
                        interaction: {
                          intersect: false,
                          mode: 'index'
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Trade Controls */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="fas fa-hand-paper me-2"></i>
                    Manual Trading
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3 align-items-center">
                    <div className="col-lg-3">
                      <label className="form-label small text-muted">Quantity</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={quantity}
                        min="0.01"
                        step="0.01"
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="col-lg-4">
                      <div className="d-grid gap-2 d-md-flex">
                        <button
                          className="btn btn-success btn-lg flex-fill"
                          onClick={handleBuy}
                          disabled={!currentPrice || quantity <= 0}
                        >
                          <i className="fas fa-arrow-up me-2"></i>
                          Buy Long
                        </button>
                        <button
                          className="btn btn-warning btn-lg flex-fill"
                          onClick={handleShortSell}
                          disabled={!currentPrice || quantity <= 0}
                        >
                          <i className="fas fa-arrow-down me-2"></i>
                          Sell Short
                        </button>
                      </div>
                    </div>
                    <div className="col-lg-5">
                      <div className="alert alert-info mb-0 py-2">
                        <small>
                          <i className="fas fa-info-circle me-1"></i>
                          Manual trades require manual closing. Auto trades close after 1 minute.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Open Positions */}
          {openPositions.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-list me-2"></i>
                      Open Positions ({openPositions.length})
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th>Side</th>
                            <th>Symbol</th>
                            <th>Entry Price</th>
                            <th>Quantity</th>
                            <th>Current Price</th>
                            <th>PNL</th>
                            <th>Time</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openPositions.map((pos) => {
                            const pnl = pos.side === "LONG"
                              ? (currentPrice - pos.buyPrice) * pos.quantity
                              : (pos.buyPrice - currentPrice) * pos.quantity;
                            return (
                              <tr key={pos.id}>
                                <td>
                                  <span className={`badge ${pos.isAutoTrade ? 'bg-info' : 'bg-secondary'}`}>
                                    {pos.isAutoTrade ? 'AUTO' : 'MANUAL'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${pos.side === 'LONG' ? 'bg-success' : 'bg-warning'}`}>
                                    {pos.side}
                                  </span>
                                </td>
                                <td className="fw-bold">{pos.symbol}</td>
                                <td>${Number(pos.buyPrice).toFixed(2)}</td>
                                <td>{pos.quantity}</td>
                                <td>${Number(currentPrice).toFixed(2)}</td>
                                <td className={pnl >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                                  ${Number(pnl).toFixed(2)}
                                </td>
                                <td>{new Date(pos.time).toLocaleTimeString()}</td>
                                <td>
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleClose(pos.id)}
                                  >
                                    <i className="fas fa-times me-1"></i>
                                    Close
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Closed Positions */}
          {closedPositions.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-history me-2"></i>
                      Trade History ({closedPositions.length})
                    </h5>
                    <button className="btn btn-outline-light btn-sm" onClick={clearHistory}>
                      <i className="fas fa-trash me-1"></i>
                      Clear History
                    </button>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive" style={{ maxHeight: "400px" }}>
                      <table className="table table-striped mb-0">
                        <thead className="table-dark sticky-top">
                          <tr>
                            <th>Type</th>
                            <th>Side</th>
                            <th>Symbol</th>
                            <th>Entry</th>
                            <th>Exit</th>
                            <th>Qty</th>
                            <th>PNL</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {closedPositions.slice().reverse().map((pos) => {
                            const duration = pos.sellTime && pos.time 
                              ? Math.round((new Date(pos.sellTime) - new Date(pos.time)) / 1000)
                              : 0;
                            return (
                              <tr key={pos.id}>
                                <td>
                                  <span className={`badge ${pos.isAutoTrade ? 'bg-info' : 'bg-secondary'}`}>
                                    {pos.isAutoTrade ? 'AUTO' : 'MANUAL'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${pos.side === 'LONG' ? 'bg-success' : 'bg-warning'}`}>
                                    {pos.side}
                                  </span>
                                </td>
                                <td className="fw-bold">{pos.symbol}</td>
                                <td>${Number(pos.buyPrice).toFixed(2)}</td>
                                <td>${Number(pos.sellPrice).toFixed(2)}</td>
                                <td>{pos.quantity}</td>
                                <td className={pos.pnl >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                                  {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                                </td>
                                <td>{duration}s</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
