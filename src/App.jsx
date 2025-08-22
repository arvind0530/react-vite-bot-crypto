import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // 🔥 This enables navbar toggle
import Login from './pages/Login';
import Navbar from './components/Navbar';
import "./assets/css/TradingDashboard.css";
import "./assets/css/EnhancedStyles.css";
import EthLive from './pages/EthLive';
import AutoData from './pages/AutoData';
import BtcLive from './pages/BtcLive';

export default function App() {
  return (
      <div style={{ fontFamily: "Inter, sans-serif" }}>
        <Navbar />
<div className="container px-4">
      {/* Main content */}
      <h1 className="text-center my-4">Crypto Trading Dashboard</h1>
      <p className="text-center text-muted mb-4">Welcome to your trading dashboard! Use the navigation above to explore.</p>
      <hr />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ethlive" element={<EthLive  />} />
        <Route path="/btclive" element={<BtcLive  />} />
        <Route path="/autodata" element={<AutoData  />} />
        
      </Routes>
    </div>
    </div>
  );
}
