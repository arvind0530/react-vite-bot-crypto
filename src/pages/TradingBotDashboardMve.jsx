import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function TradingBotDashboard() {
  const API_BASE = "http://3.108.63.70:4444/api";

  const [health, setHealth] = useState({});
  const [price, setPrice] = useState({});
  const [orders, setOrders] = useState([]);
  const [openPositions, setOpenPositions] = useState([]);
  const [pnl, setPnL] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch all data in parallel
  async function fetchAll() {
    setLoading(true);
    try {
      const [
        healthRes,
        priceRes,
        ordersRes,
        pnlRes,
        openRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/health`).then((r) => r.json()),
        fetch(`${API_BASE}/price`).then((r) => r.json()),
        fetch(`${API_BASE}/orders/history?limit=100`).then((r) => r.json()),
        fetch(`${API_BASE}/pnl/total`).then((r) => r.json()),
        fetch(`${API_BASE}/positions/open`).then((r) => r.json()),
      ]);
      setHealth(healthRes);
      setPrice(priceRes);
      setOrders(ordersRes);
      setPnL(pnlRes);
      setOpenPositions(openRes);
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div>
          <div className="spinner-border text-primary me-2"></div>
          <span className="fs-4">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* System/Health Status */}
      <div className="row g-4 mb-3">
        <div className="col-12 col-lg-3">
          <div className="card shadow-sm bg-light h-100">
            <div className="card-header bg-primary text-white fw-bold">
              System Status
            </div>
            <div className="card-body">
              <p><b>Symbol:</b> {health.symbol}</p>
              <p><b>Interval:</b> {health.interval}</p>
              <p><b>Fast EMA:</b> {health.emaFast}</p>
              <p><b>Slow EMA:</b> {health.emaSlow}</p>
              <p><b>Environment:</b> {health.dryRun ? "DRY_RUN" : "LIVE"}</p>
              <p><b>DB:</b> <span className={health.db === "DISCONNECTED" ? "text-danger fw-bold" : "text-success"}>{health.db}</span></p>
              <p><b>Last Tick:</b> {health.lastTickAt ? new Date(health.lastTickAt).toLocaleString() : "-"}</p>
              <p>
                <b>Position:</b>{" "}
                {health.position
                  ? <span className="badge bg-success">{health.position.type} @ ${health.position.entryPrice.toFixed(2)}</span>
                  : <span className="badge bg-secondary">NONE</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Market & Signal */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light text-primary fw-bold">
              Market & Signal
            </div>
            <div className="card-body">
              <p><b>Price:</b> ${price.price?.toFixed(2)}</p>
              <p><b>EMA {price.emaFast}:</b> {price.emaFastVal?.toFixed(2)}</p>
              <p><b>EMA {price.emaSlow}:</b> {price.emaSlowVal?.toFixed(2)}</p>
              <p>
                <b>Signal:</b>{" "}
                <span
                  className={
                    price.signal === "GOLDEN"
                      ? "text-success fw-bold"
                      : price.signal === "DEATH"
                      ? "text-danger fw-bold"
                      : ""
                  }
                >
                  {price.signal}
                </span>
              </p>
              <p>
                <b>Position:</b>{" "}
                {price.positionOpen
                  ? <span className="badge bg-success">{price.positionType}</span>
                  : <span className="badge bg-secondary">NONE</span>}
              </p>
              <small className="text-muted">
                Last updated: {price.lastTickAt ? new Date(price.lastTickAt).toLocaleTimeString() : "-"}
              </small>
              <div className="mt-3">
                <button className="btn btn-outline-primary w-100" onClick={fetchAll}>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PnL Summary */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm bg-light h-100">
            <div className="card-header bg-primary text-white fw-bold">
              PnL Summary
            </div>
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <h5>Total Trades: {pnl.count}</h5>
                <h5>
                  Net PnL:{" "}
                  <span className={pnl.totalPnL >= 0 ? "text-success" : "text-danger"}>
                    {pnl.totalPnL >= 0 ? "+" : ""}
                    {pnl.totalPnL}
                  </span>
                </h5>
                <p><b>Open Positions:</b> {openPositions.length}</p>
              </div>
              <button className="btn btn-primary mt-auto w-100" onClick={fetchAll}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trades History */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white fw-bold">
              Trades History (Recent)
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>PnL</th>
                    <th>Opened</th>
                    <th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4">No trades to show</td></tr>
                  ) : orders.map(o => (
                    <tr key={o._id}>
                      <td>{o.positionType}</td>
                      <td>
                        {o.status === "OPEN" ? (
                          <span className="badge bg-warning text-dark">OPEN</span>
                        ) : (
                          <span className="badge bg-success">CLOSED</span>
                        )}
                      </td>
                      <td>${o.entryPrice?.toFixed(2)}</td>
                      <td>{o.status === "CLOSED" && o.exitPrice !== undefined ? `$${o.exitPrice?.toFixed(2)}` : "-"}</td>
                      <td className={o.profitLoss > 0 ? "text-success fw-bold" : (o.profitLoss < 0 ? "text-danger fw-bold" : "")}>
                        {o.status === "CLOSED" && o.profitLoss !== undefined ? (o.profitLoss >= 0 ? "+" : "") + o.profitLoss.toFixed(2) : "-"}
                      </td>
                      <td>{o.entryTime ? new Date(o.entryTime).toLocaleString() : "-"}</td>
                      <td>{o.exitTime ? new Date(o.exitTime).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-footer text-center">
              <button className="btn btn-outline-primary" onClick={fetchAll}>Refresh All</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
