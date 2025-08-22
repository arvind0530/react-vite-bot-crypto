// src/components/AutoData.jsx
import React, { useEffect, useState } from "react";

const AutoData = () => {
  const [totalPnL, setTotalPnL] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Total PnL
  const fetchTotalPnL = async () => {
    try {
      const res = await fetch("http://3.108.63.70:4000/api/pnl/total");
      const data = await res.json();
      setTotalPnL(data.totalPnL);
    } catch (err) {
      console.error("Error fetching total PnL:", err);
    }
  };

  // Fetch Trade History
  const fetchHistory = async () => {
    try {
      const res = await fetch("http://3.108.63.70:4000/api/pnl/history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalPnL();
    fetchHistory();
  }, []);

  return (
    <div className="container my-4">
      <h1 className="mb-4 fw-bold text-primary">
        <i className="bi bi-bar-chart-fill me-2"></i>Trading Dashboard
      </h1>

      {/* Summary Section */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card shadow rounded-3 h-100">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-2">Total PnL</h5>
              <h3
                className={`fw-bold ${
                  totalPnL >= 0 ? "text-success" : "text-danger"
                }`}
              >
                ${totalPnL}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card shadow rounded-3 h-100">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-2">Total Trades</h5>
              <h3 className="fw-bold">{history.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Trade History Table */}
      <div className="card shadow rounded-3">
        <div className="card-header bg-primary bg-gradient text-white fw-semibold">
          Trade History
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>buyPrice</th>
                {/* <th>Price</th> */}
                <th>sellPrice</th>
                <th>PnL</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <span className="ms-2">Loading...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No trade history found
                  </td>
                </tr>
              ) : (
                history.map((trade, index) => (
                  <tr key={index}>
                    <td
                      className={`fw-semibold `}
                    >
                      {trade?.buyPrice}
                    </td>
                    {/* <td className="text-nowrap">${trade.price}</td> */}
                    <td>{trade.sellPrice}</td>
                    <td
                      className={`fw-medium ${
                        trade.profitLoss >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {trade.profitLoss?.toFixed(2)}
                    </td>
                    <td className="text-nowrap">
                      {new Date(trade.time).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutoData;
