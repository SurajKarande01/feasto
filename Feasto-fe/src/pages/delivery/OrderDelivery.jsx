import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../services/api/apiClient";
import DeliveryMap from "../../components/delivery/DeliveryMap";

const getPartnerId = () => {
  try {
    const raw = localStorage.getItem("deliveryProfile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.id || p?.partnerId || p?.deliveryPartnerId || null;
  } catch { return null; }
};

const OrderDelivery = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riderPosition, setRiderPosition] = useState(null);
  const rideTimerRef = useRef(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const res = await apiClient.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Start location tracking when order is OUT_FOR_DELIVERY
  useEffect(() => {
    if (!order || order.orderStatus !== "OUT_FOR_DELIVERY") return;
    if (!navigator.geolocation) return;

    const getPos = () => new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    (async () => {
      const first = await getPos();
      if (first) setRiderPosition(first);
    })();

    rideTimerRef.current = setInterval(async () => {
      const loc = await getPos();
      if (loc) {
        setRiderPosition(loc);
        const pid = getPartnerId();
        if (pid) {
          try {
            await apiClient.post(`/delivery-partners/location`, {
              deliveryPartnerId: pid,
              latitude: loc.lat,
              longitude: loc.lng,
            });
          } catch { /* ignore */ }
        }
      }
    }, 5000);

    return () => { if (rideTimerRef.current) clearInterval(rideTimerRef.current); };
  }, [order]);

  const handleStatusUpdate = async (status) => {
    try {
      await apiClient.put(`/orders/${id}/status`, null, { params: { orderStatus: status } });
      toast.success(`Order marked as ${status.replace(/_/g, " ")}`);
      if (rideTimerRef.current) clearInterval(rideTimerRef.current);
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update status");
    }
  };

  const destination = useMemo(() => {
    if (!order?.deliveryAddress?.latitude || !order?.deliveryAddress?.longitude) return null;
    return { lat: order.deliveryAddress.latitude, lng: order.deliveryAddress.longitude };
  }, [order]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading assignment details…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-white">
        <div className="text-rose-500 text-3xl mb-2">⚠️</div>
        <h2 className="text-base font-bold text-slate-800">Error Loading Delivery</h2>
        <p className="text-slate-400 text-xs max-w-xs mt-1">{error}</p>
        <Link to="/delivery-dashboard" className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer">Back to Dashboard</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-white">
        <div className="text-slate-400 text-3xl mb-2">🔍</div>
        <h2 className="text-base font-bold text-slate-800">Delivery Not Found</h2>
        <p className="text-slate-400 text-xs mt-1">We couldn't locate this active delivery in our system.</p>
        <Link to="/delivery-dashboard" className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer">Back to Dashboard</Link>
      </div>
    );
  }

  const addr = order.deliveryAddress || {};
  const itemsCount = Array.isArray(order.orderItems) ? order.orderItems.reduce((a, it) => a + (it.quantity || 0), 0) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
        <div>
          <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Delivery assignment</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Delivery #{order.orderId}</h1>
          <p className="text-slate-500 text-xs mt-1.5">Current Status: <span className="font-extrabold uppercase tracking-wide text-rose-500">{order.orderStatus?.replace(/_/g, " ")}</span></p>
        </div>
        <Link to="/delivery-dashboard" className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer self-start sm:self-center shrink-0">
          ← Dashboard
        </Link>
      </div>

      {/* Map */}
      {destination && order.orderStatus === "OUT_FOR_DELIVERY" && (
        <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          <DeliveryMap origin={riderPosition} destination={destination} height={350} />
        </div>
      )}

      {order.orderStatus === "DELIVERED" && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-6 mb-8 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-lg font-black text-emerald-700">Delivery Completed!</h2>
          <p className="text-emerald-600/80 text-xs mt-1">Excellent job! This delivery has been successfully finalized.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Order Summary */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Order Summary</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Order ID</span>
                <span className="font-bold text-slate-800">#{order.orderId}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Total Items</span>
                <span className="font-bold text-slate-800">{itemsCount} qty</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Earnings Payout</span>
                <span className="font-black text-rose-500">₹{Number((order.deliveryFee != null ? order.deliveryFee : (order.totalAmount > 0 ? 30 : 0)) + (order.tipAmount || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Customer</span>
                <span className="font-bold text-slate-800">User #{order.userId}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="font-semibold text-slate-400">Restaurant</span>
                <span className="font-bold text-slate-800">{order.restaurantName || `#${order.restaurantId}`}</span>
              </div>
            </div>

            {Array.isArray(order.orderItems) && order.orderItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Items list</h3>
                <div className="space-y-2.5">
                  {order.orderItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">
                        {it.menuItemName || `Item #${it.menuItemId}`} 
                        <span className="text-rose-500 font-extrabold ml-1.5">× {it.quantity}</span>
                      </span>
                      <span className="text-slate-900 font-extrabold">₹{Number((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address & Actions */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
          <div>
            <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Delivery Address</h2>
            <div className="space-y-2 text-xs text-slate-600">
              <div><span className="font-semibold text-slate-400">Street:</span> <span className="font-bold text-slate-800">{addr.street || "—"}</span></div>
              <div><span className="font-semibold text-slate-400">City / State:</span> <span className="font-bold text-slate-800">{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ") || "—"}</span></div>
              <div><span className="font-semibold text-slate-400">Country:</span> <span className="font-bold text-slate-800">{addr.country || "—"}</span></div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-50 space-y-3">
            {order.orderStatus === "ASSIGNED" && (
              <button 
                onClick={() => handleStatusUpdate("OUT_FOR_DELIVERY")} 
                className="w-full px-5 py-3 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
              >
                🛵 Start Delivery
              </button>
            )}
            {order.orderStatus === "OUT_FOR_DELIVERY" && (
              <button 
                onClick={() => handleStatusUpdate("DELIVERED")} 
                className="w-full px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                ✅ Mark as Delivered
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDelivery;
