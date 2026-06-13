import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  ASSIGNED: "bg-yellow-50 text-yellow-700 border-yellow-100",
  OUT_FOR_DELIVERY: "bg-sky-50 text-sky-700 border-sky-100",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-100",
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
    <div className="max-w-5xl mx-auto px-6 py-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
        <div>
          <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Assigned Dashboard</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Active Deliveries</h1>
          <p className="text-slate-500 text-xs mt-1.5">View and manage your delivery assignments</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer self-start sm:self-center shrink-0">
          Refresh List
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {tabs.map(t => (
          <button 
            key={t} 
            onClick={() => setFilter(t)} 
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
              filter === t 
                ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
                : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {t === "ALL" ? `All Orders (${orders.length})` : `${t.replace(/_/g, " ")} (${orders.filter(o => o.orderStatus === t).length})`}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading assignments…</span>
        </div>
      )}
      {error && <div className="text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl py-4 font-semibold text-sm">{error}</div>}
      
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-base font-bold text-slate-700">No orders found</h3>
          <p className="text-slate-400 text-xs mt-1">No {filter === "ALL" ? "" : filter.replace(/_/g, " ").toLowerCase()} orders assigned to you.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-6">
          {filtered.map(o => {
            const itemsCount = Array.isArray(o.orderItems) ? o.orderItems.reduce((a, it) => a + (it.quantity || 0), 0) : 0;
            const addr = o.deliveryAddress || {};
            const addressStr = [addr.street, addr.city].filter(Boolean).join(", ") || "—";
            const dateStr = o.orderTime ? new Date(o.orderTime).toLocaleString() : "—";
            return (
              <div key={o.orderId} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-base">Order #{o.orderId}</span>
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS[o.orderStatus] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                      {o.orderStatus?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{dateStr}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs font-semibold text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-1">Items Count</span>
                    <span className="text-slate-800 text-sm font-bold">{itemsCount} qty</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-1">Total Payout</span>
                    <span className="text-slate-800 text-sm font-black text-rose-500">₹{Number((o.deliveryFee != null ? o.deliveryFee : (o.totalAmount > 0 ? 30 : 0)) + (o.tipAmount || 0)).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-1">Delivery Address</span>
                    <span className="text-slate-800 text-xs font-bold leading-normal truncate block">{addressStr}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50/50">
                  {o.orderStatus === "ASSIGNED" && (
                    <button 
                      onClick={() => handleStatusUpdate(o.orderId, "OUT_FOR_DELIVERY")} 
                      className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
                    >
                      Start Delivery
                    </button>
                  )}
                  {o.orderStatus === "OUT_FOR_DELIVERY" && (
                    <button 
                      onClick={() => handleStatusUpdate(o.orderId, "DELIVERED")} 
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      Mark Delivered
                    </button>
                  )}
                  <Link 
                    to={`/order-delivery/${o.orderId}`}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm cursor-pointer ml-auto"
                  >
                    View Details
                  </Link>
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
