import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

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
              <Link className="nav-link px-3 border rounded" to="/orders">Orders</Link>
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


// import React from "react";
// import { Link } from "react-router-dom";
// import "bootstrap/dist/css/bootstrap.min.css";
// import { Button } from "bootstrap";

// export default function Navbar() {
//   return (
//     <nav className="navbar navbar-expand-lg navbar-dark bg-dark rounded shadow mb-4">
//       <div className="container">
//         {/* <Link className="navbar-brand fw-bold" to="/">
//           Crypto Live Prices
//         </Link>
//         <Button
//           className="navbar-toggler"
//           type="button"
//           data-bs-toggle="collapse"
//           data-bs-target="#navbarNav"
//         >
//           <span className="navbar-toggler-icon"></span>
//         </Button> */}

//         <div className="navbar-collapse" id="navbarNav">
//           <ul className="navbar-nav ms-auto d-flex flex-row flex-wrap  gap-2">
//             <li className="nav-item border px-1 rounded"><Link className="nav-link" to="/">Login</Link></li>
//             <li className="nav-item border px-1 rounded"><Link className="nav-link" to="/products">Products</Link></li>
//             <li className="nav-item border px-1 rounded"><Link className="nav-link" to="tradingview">tradingview</Link></li>
//             <li className="nav-item border px-1 rounded"><Link className="nav-link" to="/orders">Orders</Link></li>
//             <li className="nav-item border px-1 rounded"><Link className="nav-link" to="/ethlive">ETH live</Link></li>
//             <li className="nav-item border px-1 rounded"><Link className="nav-link" to="/btclive">BTC Live</Link></li>
//             <li className="nav-item border px-1 rounded"><Link className="nav-link" to="/AutoBtcLiveChart">Auto BTC Live Chart</Link></li>
//           </ul>
//         </div>
//       </div>
//     </nav>
//   );
// }
