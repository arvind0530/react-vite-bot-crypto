import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark rounded shadow mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold text-uppercase" to="/">
          Crypto Dashboard
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto d-flex flex-row flex-wrap gap-2">
            <li className="nav-item">
              <Link className="nav-link px-3 border rounded" to="/">Login</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 border rounded" to="/products">Products</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 border rounded" to="/tradingview">TradingView</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 border rounded" to="/tradingbotdashboardmve">Dashboard MVE</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 border rounded" to="/ethlive">ETH Live</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 border rounded" to="/btclive">BTC Live</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 border rounded" to="/autodata">Auto Data</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}