import React from "react";

export default function MarketList({ symbols, onSelect }) {
  return (
    <div style={{ padding: "10px", borderRight: "1px solid #ccc" }}>
      <h4>Markets</h4>
      {symbols.map((sym) => (
        <div
          key={sym.symbol}
          style={{
            padding: "8px",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
          }}
          onClick={() => onSelect(sym.symbol)}
        >
          {sym.name}
        </div>
      ))}
    </div>
  );
}
