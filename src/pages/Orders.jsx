// src/pages/Orders.jsx
import React, { useMemo, useState } from "react";
import { useGetOrdersQuery, useCancelOrderMutation, useEditOrderMutation } from "../redux/orders/api";

const StatusBadge = ({ state }) => {
  const map = {
    open: "warning",
    pending: "secondary",
    filled: "success",
    closed: "success",
    cancelled: "danger",
  };
  const variant = map[state] || "secondary";
  return <span className={`badge text-bg-${variant} text-uppercase`}>{state || "NA"}</span>;
};

export default function Orders() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("");
  const [side, setSide] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } = useGetOrdersQuery({
    state: tab === "all" ? undefined : tab,
    product_symbol: product || undefined,
    limit: 100,
    page: 1,
  });

  const [cancelOrder, { isLoading: canceling }] = useCancelOrderMutation();
  const [editOrder, { isLoading: editing }] = useEditOrderMutation();

  const orders = useMemo(() => {
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list
      .filter((o) => (tab === "all" ? true : o.state === tab))
      .filter((o) => (product ? o.product_symbol === product : true))
      .filter((o) => (side ? o.side === side : true))
      .filter((o) =>
        search
          ? (o.product_symbol || "").toLowerCase().includes(search.toLowerCase()) ||
            String(o.id || "").includes(search) ||
            (o.client_order_id || "").toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [data, tab, product, side, search]);

  const uniqueProducts = useMemo(() => {
    const set = new Set();
    (Array.isArray(data?.data) ? data.data : data || []).forEach((o) => {
      if (o.product_symbol) set.add(o.product_symbol);
    });
    return Array.from(set);
  }, [data]);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-0">Order History</h2>
          <small className="text-muted">{isFetching ? "Updating…" : " "}</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6">
              <div className="btn-group w-100" role="group">
                {["all", "open", "pending", "filled", "cancelled"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`btn btn-${tab === t ? "primary" : "outline-primary"}`}
                    onClick={() => setTab(t)}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={product} onChange={(e) => setProduct(e.target.value)}>
                <option value="">All Products</option>
                {uniqueProducts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="">All Sides</option>
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <span className="me-2">⚠️</span>
          <div>{error?.data?.message || error?.error || "Failed to fetch orders"}</div>
          <button className="btn btn-sm btn-link ms-auto" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: 280 }}>
          <div className="spinner-border" role="status" aria-hidden="true" />
          <span className="ms-2">Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center text-muted py-5">
            <div style={{ fontSize: 40 }}>☹️</div>
            <div className="mt-2">No Orders Found</div>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Time</th>
                  <th>Product</th>
                  <th>Side</th>
                  <th>Type</th>
                  <th className="text-end">Price</th>
                  <th className="text-end">Size</th>
                  <th className="text-center">Filled</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const filled = Number(o.size || 0) - Number(o.unfilled_size || 0);
                  const pct = o.size ? Math.max(0, Math.min(100, (filled / o.size) * 100)) : 0;
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="small text-muted">{new Date(o.created_at || o.createdAt).toLocaleString()}</div>
                        {o.client_order_id && <div className="small text-muted">ID: {o.client_order_id}</div>}
                      </td>
                      <td className="fw-semibold">{o.product_symbol}</td>
                      <td>
                        <span className={`badge text-bg-${o.side === "buy" ? "success" : "danger"}`}>
                          {o.side?.toUpperCase()}
                        </span>
                      </td>
                      <td>{o.order_type === "limit_order" ? "Limit" : "Market"}</td>
                      <td className="text-end">{o.limit_price ?? o.price ?? "-"}</td>
                      <td className="text-end">{o.size ?? "-"}</td>
                      <td className="text-center" style={{ minWidth: 160 }}>
                        <div className="progress" style={{ height: 6 }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                            aria-valuenow={pct}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>
                        <div className="small text-muted mt-1">
                          {filled}/{o.size} ({Math.round(pct)}%)
                        </div>
                      </td>
                      <td>
                        <StatusBadge state={o.state} />
                      </td>
                      <td className="text-end">
                        {(o.state === "open" || o.state === "pending") && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-secondary me-2"
                              disabled={editing}
                              onClick={async () => {
                                // demo edit: increase price by 1 (you can show modal to edit properly)
                                const newPrice =
                                  (Number(o.limit_price ?? o.price ?? 0) || 0) + 1;
                                await editOrder({ id: o.id, price: newPrice, size: o.size });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={canceling}
                              onClick={() => cancelOrder({ id: o.id })}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isFetching && (
            <div className="text-center py-2 small text-muted border-top">Updating…</div>
          )}
        </div>
      )}
    </div>
  );
}
