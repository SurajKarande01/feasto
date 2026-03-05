import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const RestaurantOrders = () => {
  const [ordersPage, setOrdersPage] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10,
    empty: true,
    first: true,
    last: true,
  });
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusTab, setStatusTab] = useState("PLACED");
  const [refreshTick, setRefreshTick] = useState(0);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const base = `http://localhost:8080/api/restaurants/1/orders`;
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("status", statusTab);
        const url = `${base}?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
        const data = await res.json();
        setOrdersPage({
          content: Array.isArray(data?.content) ? data.content : [],
          totalPages: data?.totalPages ?? 0,
          totalElements: data?.totalElements ?? 0,
          number: data?.number ?? page,
          size: data?.size ?? limit,
          empty: !!data?.empty,
          first: !!data?.first,
          last: !!data?.last,
        });
      } catch (e) {
        if (e.name !== "AbortError")
          setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    return () => controller.abort();
  }, [page, limit, statusTab, refreshTick]);

  const filtered = useMemo(() => {
    return ordersPage.content;
  }, [ordersPage.content]);

  const loadAvailablePartners = async () => {
    try {
      setPartnersLoading(true);
      const res = await fetch(
        "http://localhost:8080/api/delivery-partners/available"
      );
      if (!res.ok)
        throw new Error("Failed to load available delivery partners");
      const data = await res.json();
      setAvailablePartners(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || "Could not fetch delivery partners");
    } finally {
      setPartnersLoading(false);
    }
  };

  const handleAutoAssign = async (orderId) => {
    try {
      const url = `http://localhost:8080/api/orders/${orderId}/auto-assign-delivery-partner`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Auto assignment failed");
      toast.success("Delivery partner auto-assigned");
      setRefreshTick((t) => t + 1);
    } catch (e) {
      toast.error(e.message || "Auto assignment failed");
    }
  };

  const handleManualAssign = async (orderId) => {
    const partnerId = selectedPartner[orderId];
    if (!partnerId) {
      toast.info("Please select a delivery partner");
      return;
    }
    try {
      const url = `http://localhost:8080/api/orders/${orderId}/assign-delivery-partner?deliveryPartnerId=${partnerId}`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Manual assignment failed");
      toast.success("Delivery partner assigned successfully");
      setRefreshTick((t) => t + 1);
    } catch (e) {
      toast.error(e.message || "Manual assignment failed");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Restaurant Orders</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Page size</span>
          <select
            value={limit}
            onChange={(e) => {
              setPage(0);
              setLimit(parseInt(e.target.value, 10));
            }}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 12 }}>
        <div className="tab-group">
          <div className="tab-group-title">User</div>
          {["PLACED", "CANCELLED"].map((s) => (
            <button
              key={s}
              className={`tab-btn ${statusTab === s ? "active" : ""}`}
              onClick={() => {
                setPage(0);
                setStatusTab(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="tab-group">
          <div className="tab-group-title">Restaurant</div>
          {["ACCEPTED", "REJECTED", "PREPARING", "ASSIGNED"].map((s) => (
            <button
              key={s}
              className={`tab-btn ${statusTab === s ? "active" : ""}`}
              onClick={() => {
                setPage(0);
                setStatusTab(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="tab-group">
          <div className="tab-group-title">Delivery</div>
          {["OUT_FOR_DELIVERY", "DELIVERED"].map((s) => (
            <button
              key={s}
              className={`tab-btn ${statusTab === s ? "active" : ""}`}
              onClick={() => {
                setPage(0);
                setStatusTab(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>

        
      </div>

      {loading ? (
        <div style={{ padding: 16 }}>Loading orders...</div>
      ) : error ? (
        <div style={{ padding: 16, color: "#b91c1c" }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 16 }}>No orders to display.</div>
      ) : (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Order ID
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  User
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Items
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Order Time
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  City
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const dateStr = o?.orderTime
                  ? new Date(o.orderTime).toLocaleString()
                  : "-";
                const itemsCount = Array.isArray(o?.orderItems)
                  ? o.orderItems.reduce(
                      (acc, it) => acc + (it?.quantity || 0),
                      0
                    )
                  : 0;
                const city = o?.deliveryAddress?.city || "-";
                return (
                  <tr key={o.orderId}>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      #{o.orderId}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      {o.userId}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      {itemsCount}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      ₹{Number(o.totalAmount || 0).toFixed(2)}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          background:
                            o.orderStatus === "DELIVERED"
                              ? "#dcfce7"
                              : o.orderStatus === "PLACED"
                              ? "#e0e7ff"
                              : o.orderStatus === "CANCELLED"
                              ? "#fee2e2"
                              : o.orderStatus === "REJECTED"
                              ? "#fee2e2"
                              : o.orderStatus === "OUT_FOR_DELIVERY"
                              ? "#cffafe"
                              : o.orderStatus === "ASSIGNED"
                              ? "#fef3c7"
                              : "#f3f4f6",
                          color:
                            o.orderStatus === "DELIVERED"
                              ? "#166534"
                              : o.orderStatus === "PLACED"
                              ? "#3730a3"
                              : o.orderStatus === "CANCELLED" ||
                                o.orderStatus === "REJECTED"
                              ? "#991b1b"
                              : o.orderStatus === "OUT_FOR_DELIVERY"
                              ? "#0e7490"
                              : o.orderStatus === "ASSIGNED" ||
                                o.orderStatus === "PREPARING" ||
                                o.orderStatus === "ACCEPTED"
                              ? "#92400e"
                              : "#374151",
                        }}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      {dateStr}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      {city}
                    </td>
                    <td
                      style={{ padding: 12, borderBottom: "1px solid #f3f4f6" }}
                    >
                      {o.orderStatus === "PLACED" ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={() => handleAutoAssign(o.orderId)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #d1d5db",
                              background: "#111827",
                              color: "#fff",
                            }}
                          >
                            Auto Assign
                          </button>

                          <select
                            disabled={partnersLoading}
                            value={selectedPartner[o.orderId] || ""}
                            onClick={() => {
                              if (availablePartners.length === 0) {
                                loadAvailablePartners();
                              }
                            }}
                            onChange={(e) =>
                              setSelectedPartner((prev) => ({
                                ...prev,
                                [o.orderId]: e.target.value,
                              }))
                            }
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              minWidth: 160,
                            }}
                          >
                            <option value="" disabled>
                              {partnersLoading
                                ? "Loading partners..."
                                : "Select Partner"}
                            </option>
                            {availablePartners.map((p) => (
                              <option
                                key={p?.id || p?.deliveryPartnerId}
                                value={p?.id || p?.deliveryPartnerId}
                              >
                                {p?.name ||
                                  p?.fullName ||
                                  `Partner ${p?.id || p?.deliveryPartnerId}`}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleManualAssign(o.orderId)}
                            disabled={!selectedPartner[o.orderId]}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #d1d5db",
                              background: "#fff",
                            }}
                          >
                            Assign
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#6b7280" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <div style={{ color: "#6b7280" }}>
          Showing {filtered.length} of {ordersPage.totalElements} orders
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={loading || ordersPage.first}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: ordersPage.first ? "not-allowed" : "pointer",
            }}
          >
            Prev
          </button>
          <span>
            Page {ordersPage.number + 1} of {Math.max(ordersPage.totalPages, 1)}
          </span>
          <button
            onClick={() => setPage((p) => (ordersPage.last ? p : p + 1))}
            disabled={loading || ordersPage.last}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: ordersPage.last ? "not-allowed" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrders;
