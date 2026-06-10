import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../services/api/apiClient";

const getPartnerId = () => {
  try {
    const raw = localStorage.getItem("deliveryProfile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.id || p?.partnerId || p?.deliveryPartnerId || null;
  } catch { return null; }
};

const STATUS_COLORS = {
  ASSIGNED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  OUT_FOR_DELIVERY: "bg-sky-50 text-sky-700 border-sky-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const AssignedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = useCallback(async () => {
    const id = getPartnerId();
    if (!id) { setError("Please login as a delivery partner"); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await apiClient.get(`/delivery-partners/${id}/orders`);
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data.sort((a, b) => new Date(b.orderTime || 0) - new Date(a.orderTime || 0)));
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load orders");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, null, { params: { orderStatus: newStatus } });
      toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update status");
    }
  };

  const filtered = useMemo(() => {
    if (filter === "ALL") return orders;
    return orders.filter(o => o.orderStatus === filter);
  }, [orders, filter]);

  const tabs = ["ALL", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assigned Orders</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage your delivery assignments</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Refresh</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filter === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
            {t === "ALL" ? `All (${orders.length})` : `${t.replace(/_/g, " ")} (${orders.filter(o => o.orderStatus === t).length})`}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-16 text-gray-500">Loading orders…</div>}
      {error && <div className="text-center py-16 text-red-500">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="text-lg font-semibold text-gray-700">No orders found</h3>
          <p className="text-gray-500 text-sm mt-1">No {filter === "ALL" ? "" : filter.replace(/_/g, " ").toLowerCase()} orders assigned to you.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(o => {
            const itemsCount = Array.isArray(o.orderItems) ? o.orderItems.reduce((a, it) => a + (it.quantity || 0), 0) : 0;
            const addr = o.deliveryAddress || {};
            const addressStr = [addr.street, addr.city].filter(Boolean).join(", ") || "—";
            const dateStr = o.orderTime ? new Date(o.orderTime).toLocaleString() : "—";
            return (
              <div key={o.orderId} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-gray-900">Order #{o.orderId}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.orderStatus] || "bg-gray-50 text-gray-700 border-gray-200"}`}>{o.orderStatus?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-sm text-gray-500">{dateStr}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                  <div><span className="text-gray-500">Items:</span> <span className="font-medium">{itemsCount}</span></div>
                  <div><span className="text-gray-500">Amount:</span> <span className="font-bold">₹{Number(o.totalAmount || 0).toFixed(2)}</span></div>
                  <div><span className="text-gray-500">Deliver to:</span> <span>{addressStr}</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.orderStatus === "ASSIGNED" && (
                    <button onClick={() => handleStatusUpdate(o.orderId, "OUT_FOR_DELIVERY")} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700">
                      Start Delivery
                    </button>
                  )}
                  {o.orderStatus === "OUT_FOR_DELIVERY" && (
                    <button onClick={() => handleStatusUpdate(o.orderId, "DELIVERED")} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg font-medium hover:bg-emerald-700">
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignedOrders;
