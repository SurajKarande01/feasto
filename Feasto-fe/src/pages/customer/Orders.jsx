import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getOrdersByUserId, cancelOrder, submitReview } from "../../services/api/customerService";
import Footer from "../../components/common/Footer";

const STATUS_COLORS = {
  PLACED: "bg-indigo-50 text-indigo-700 border-indigo-100",
  ACCEPTED: "bg-amber-50 text-amber-700 border-amber-100",
  PREPARING: "bg-orange-50 text-orange-700 border-orange-100",
  ASSIGNED: "bg-yellow-50 text-yellow-700 border-yellow-100",
  OUT_FOR_DELIVERY: "bg-sky-50 text-sky-700 border-sky-100",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-100",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
};

const StatusBadge = ({ status }) => (
  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
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
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [riderRating, setRiderRating] = useState(5);
  const [riderComment, setRiderComment] = useState("");
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
      const promises = [];
      if (reviewOrder.restaurantId) {
        promises.push(submitReview({ orderId: reviewOrder.orderId, userId: reviewOrder.userId, restaurantId: reviewOrder.restaurantId, rating: restaurantRating, comment: restaurantComment }));
      }
      if (reviewOrder.deliveryPartnerId) {
        promises.push(submitReview({ orderId: reviewOrder.orderId, userId: reviewOrder.userId, deliveryPartnerId: reviewOrder.deliveryPartnerId, rating: riderRating, comment: riderComment }));
      }
      await Promise.all(promises);
      toast.success("Reviews submitted!"); 
      setReviewOrder(null); setRestaurantRating(5); setRestaurantComment(""); setRiderRating(5); setRiderComment("");
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to submit review"); }
    finally { setReviewSubmitting(false); }
  };

  const filtered = useMemo(() => filter === "ALL" ? orders : orders.filter(o => o.orderStatus === filter), [orders, filter]);
  const activeCount = useMemo(() => orders.filter(o => !["DELIVERED","CANCELLED","REJECTED"].includes(o.orderStatus)).length, [orders]);
  const deliveredCount = useMemo(() => orders.filter(o => o.orderStatus === "DELIVERED").length, [orders]);
  const totalSpent = useMemo(() => orders.filter(o => o.orderStatus === "DELIVERED").reduce((s, o) => s + (o.totalAmount || 0), 0), [orders]);

  const tabs = ["ALL","PLACED","ACCEPTED","PREPARING","ASSIGNED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Order Tracking</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Track live status and view your full order history</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-rose-50/30 border border-rose-100/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(244,63,94,0.01)]">
            <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">Active Orders</div>
            <div className="text-3xl font-black text-rose-600 mt-1.5">{activeCount}</div>
          </div>
          <div className="bg-emerald-50/30 border border-emerald-100/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(16,185,129,0.01)]">
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Delivered Orders</div>
            <div className="text-3xl font-black text-emerald-600 mt-1.5">{deliveredCount}</div>
          </div>
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Value</div>
            <div className="text-3xl font-black text-slate-950 mt-1.5">₹{totalSpent.toFixed(2)}</div>
          </div>
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
              {t === "ALL" ? "All Orders" : t.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading orders…</span>
          </div>
        )}
        {error && <div className="text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl py-4 font-semibold text-sm">{error}</div>}
        
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-base font-bold text-slate-700">No orders found</h3>
            <p className="text-slate-400 text-xs mt-1 mb-6">Looks like you haven't placed any orders in this state yet.</p>
            <Link to="/customer-dashboard" className="px-6 py-3 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20">
              Browse Restaurants
            </Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-6">
            {filtered.map(o => {
              const itemsCount = Array.isArray(o.orderItems) ? o.orderItems.reduce((a, it) => a + (it.quantity || 0), 0) : 0;
              const addr = o.deliveryAddress || {};
              const addressStr = [addr.street, addr.city, addr.state].filter(Boolean).join(", ") || "—";
              const dateStr = o.orderTime ? new Date(o.orderTime).toLocaleString() : "—";
              return (
                <div key={o.orderId} className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-base">Order #{o.orderId}</span>
                        <StatusBadge status={o.orderStatus} />
                        {o.restaurantName && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5">
                            🍽️ {o.restaurantName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">{dateStr}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Quantity</span>
                        <span className="font-extrabold text-slate-800">{itemsCount} item(s)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Total Amount</span>
                        <span className="font-black text-rose-600 text-sm">₹{Number(o.totalAmount || 0).toFixed(2)}</span>
                        {o.discountAmount > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            (Saved ₹{Number(o.discountAmount).toFixed(2)})
                          </span>
                        )}
                        {o.tipAmount > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium block">
                            (Includes ₹{Number(o.tipAmount).toFixed(2)} tip)
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Delivery Address</span>
                        <span className="font-medium text-slate-600 truncate block max-w-[200px]" title={addressStr}>{addressStr}</span>
                      </div>
                      {o.deliveryPartnerName && (
                        <div className="col-span-full sm:col-span-1">
                          <span className="text-slate-400 font-semibold block mb-0.5">Delivery Rider</span>
                          <span className="font-bold text-emerald-600">🚴 {o.deliveryPartnerName}</span>
                        </div>
                      )}
                    </div>

                    {Array.isArray(o.orderItems) && o.orderItems.length > 0 && (
                      <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                        {o.orderItems.map((it, idx) => (
                          <span key={idx} className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-100/60">
                            {it.menuItemName || `Item #${it.menuItemId}`} × {it.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-50 pt-4">
                      {["PLACED","ACCEPTED","PREPARING","ASSIGNED","OUT_FOR_DELIVERY"].includes(o.orderStatus) && (
                        <Link 
                          to={`/order-tracking/${o.orderId}`} 
                          className="px-5 py-2 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20"
                        >
                          Track Order
                        </Link>
                      )}
                      {o.orderStatus === "PLACED" && (
                        <button 
                          onClick={() => handleCancel(o.orderId)} 
                          className="px-5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                      {o.orderStatus === "DELIVERED" && (
                        <button 
                          onClick={() => { setReviewOrder(o); setRestaurantRating(5); setRestaurantComment(""); setRiderRating(5); setRiderComment(""); }} 
                          className="px-5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl border border-amber-200/40 transition-all cursor-pointer"
                        >
                          ★ Rate & Review
                        </button>
                      )}
                      {o.orderStatus === "DELIVERED" && (
                        <Link 
                          to={`/restaurant/${o.restaurantId}`} 
                          className="px-5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 text-xs font-bold rounded-xl transition-all"
                        >
                          Reorder
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-6 text-xs text-slate-400 text-center font-medium">
            Showing {filtered.length} of {orders.length} orders
          </div>
        )}
      </div>
      <Footer />

      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <div className="absolute inset-0" onClick={() => setReviewOrder(null)} />
          <div className="relative bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 w-full max-w-md mx-4 my-auto max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4 sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Feedback</span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Rate Order #{reviewOrder.orderId}</h3>
              </div>
              <button 
                onClick={() => setReviewOrder(null)} 
                className="p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Restaurant Rating Section */}
            <div className="mb-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">🍽️ Rate Restaurant</h4>
              <div className="mb-3">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setRestaurantRating(s)} 
                      className={`text-2xl hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer ${
                        s <= restaurantRating ? "text-amber-400" : "text-slate-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <textarea 
                  value={restaurantComment} 
                  onChange={e => setRestaurantComment(e.target.value)} 
                  rows={2} 
                  placeholder="How was the food?" 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm resize-none" 
                />
              </div>
            </div>

            {/* Rider Rating Section */}
            {reviewOrder.deliveryPartnerId && (
              <div className="mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">🚴 Rate Delivery Partner</h4>
                <div className="mb-3">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setRiderRating(s)} 
                        className={`text-2xl hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer ${
                          s <= riderRating ? "text-amber-400" : "text-slate-200"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <textarea 
                    value={riderComment} 
                    onChange={e => setRiderComment(e.target.value)} 
                    rows={2} 
                    placeholder="How was the delivery experience?" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm resize-none" 
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t border-slate-50 pt-5 mt-2">
              <button 
                onClick={() => setReviewOrder(null)} 
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button 
                onClick={handleReviewSubmit} 
                disabled={reviewSubmitting} 
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
