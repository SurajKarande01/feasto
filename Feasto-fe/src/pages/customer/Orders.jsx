import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getOrdersByUserId, cancelOrder, submitReview } from "../../services/api/customerService";
import Footer from "../../components/common/Footer";

const STATUS_COLORS = {
  PLACED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ACCEPTED: "bg-amber-50 text-amber-700 border-amber-200",
  PREPARING: "bg-orange-50 text-orange-700 border-orange-200",
  ASSIGNED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  OUT_FOR_DELIVERY: "bg-sky-50 text-sky-700 border-sky-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
    {status?.replace(/_/g, " ")}
  </span>
);

const getUserId = () => {
  try {
    const raw = localStorage.getItem("customerProfile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.userId || p?.id || null;
  } catch { return null; }
};

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setError("Please login to view your orders"); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const data = await getOrdersByUserId(userId);
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.orderTime || 0) - new Date(a.orderTime || 0));
      setOrders(sorted);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load orders");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try { await cancelOrder(orderId); toast.success("Order cancelled"); fetchOrders(); }
    catch (err) { toast.error(err?.response?.data?.error || "Failed to cancel order"); }
  };

  const handleReviewSubmit = async () => {
    if (!reviewOrder) return;
    setReviewSubmitting(true);
    try {
      await submitReview({ orderId: reviewOrder.orderId, userId: reviewOrder.userId, restaurantId: reviewOrder.restaurantId, rating: reviewRating, comment: reviewComment });
      toast.success("Review submitted!"); setReviewOrder(null); setReviewRating(5); setReviewComment("");
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to submit review"); }
    finally { setReviewSubmitting(false); }
  };

  const filtered = useMemo(() => filter === "ALL" ? orders : orders.filter(o => o.orderStatus === filter), [orders, filter]);
  const activeCount = useMemo(() => orders.filter(o => !["DELIVERED","CANCELLED","REJECTED"].includes(o.orderStatus)).length, [orders]);
  const deliveredCount = useMemo(() => orders.filter(o => o.orderStatus === "DELIVERED").length, [orders]);
  const totalSpent = useMemo(() => orders.filter(o => o.orderStatus === "DELIVERED").reduce((s, o) => s + (o.totalAmount || 0), 0), [orders]);

  const tabs = ["ALL","PLACED","ACCEPTED","PREPARING","ASSIGNED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all your food orders</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 shadow-sm"><div className="text-sm text-gray-500">Active Orders</div><div className="text-2xl font-bold text-blue-600 mt-1">{activeCount}</div></div>
          <div className="bg-white rounded-xl border p-4 shadow-sm"><div className="text-sm text-gray-500">Delivered</div><div className="text-2xl font-bold text-emerald-600 mt-1">{deliveredCount}</div></div>
          <div className="bg-white rounded-xl border p-4 shadow-sm"><div className="text-sm text-gray-500">Total Spent</div><div className="text-2xl font-bold text-gray-900 mt-1">₹{totalSpent.toFixed(2)}</div></div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filter === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {t === "ALL" ? "All Orders" : t.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-16 text-gray-500">Loading your orders…</div>}
        {error && <div className="text-center py-16 text-red-500">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-700">No orders found</h3>
            <Link to="/customer-dashboard" className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Browse Restaurants</Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map(o => {
              const itemsCount = Array.isArray(o.orderItems) ? o.orderItems.reduce((a, it) => a + (it.quantity || 0), 0) : 0;
              const addr = o.deliveryAddress || {};
              const addressStr = [addr.street, addr.city, addr.state].filter(Boolean).join(", ") || "—";
              const dateStr = o.orderTime ? new Date(o.orderTime).toLocaleString() : "—";
              return (
                <div key={o.orderId} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-wrap"><span className="font-bold text-gray-900">Order #{o.orderId}</span><StatusBadge status={o.orderStatus} /></div>
                      <div className="text-sm text-gray-500">{dateStr}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-gray-500">Items:</span> <span className="font-medium">{itemsCount} item(s)</span></div>
                      <div><span className="text-gray-500">Total:</span> <span className="font-bold">₹{Number(o.totalAmount || 0).toFixed(2)}</span></div>
                      <div><span className="text-gray-500">Delivery:</span> <span>{addressStr}</span></div>
                    </div>
                    {Array.isArray(o.orderItems) && o.orderItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                        {o.orderItems.map((it, idx) => <span key={idx} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border">{it.menuItemName || `Item #${it.menuItemId}`} × {it.quantity}</span>)}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["ACCEPTED","PREPARING","ASSIGNED","OUT_FOR_DELIVERY"].includes(o.orderStatus) && <Link to={`/order-tracking/${o.orderId}`} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700">Track Order</Link>}
                      {o.orderStatus === "PLACED" && <button onClick={() => handleCancel(o.orderId)} className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-200 hover:bg-red-100">Cancel Order</button>}
                      {o.orderStatus === "DELIVERED" && <button onClick={() => { setReviewOrder(o); setReviewRating(5); setReviewComment(""); }} className="px-4 py-2 bg-amber-50 text-amber-700 text-sm rounded-lg font-medium border border-amber-200 hover:bg-amber-100">★ Rate & Review</button>}
                      {o.orderStatus === "DELIVERED" && <Link to={`/restaurant/${o.restaurantId}`} className="px-4 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg font-medium border hover:bg-gray-100">Reorder</Link>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 text-sm text-gray-500 text-center">Showing {filtered.length} of {orders.length} orders</div>
      </div>
      <Footer />

      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewOrder(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Rate Order #{reviewOrder.orderId}</h3><button onClick={() => setReviewOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Rating</label><div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewRating(s)} className={`text-2xl ${s <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}>★</button>)}</div></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Comment</label><textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} placeholder="Share your experience..." className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:border-blue-500 outline-none resize-none" /></div>
            <div className="flex gap-3"><button onClick={() => setReviewOrder(null)} className="flex-1 px-4 py-2.5 rounded-xl border text-gray-700 font-medium hover:bg-gray-50">Cancel</button><button onClick={handleReviewSubmit} disabled={reviewSubmitting} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">{reviewSubmitting ? "Submitting..." : "Submit Review"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
