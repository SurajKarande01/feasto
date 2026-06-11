import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../services/api/apiClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon issue in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STEPS = ["PLACED", "ACCEPTED", "PREPARING", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"];
const STEP_LABELS = { 
  PLACED: "Placed", 
  ACCEPTED: "Accepted", 
  PREPARING: "Kitchen", 
  ASSIGNED: "Rider Assigned", 
  OUT_FOR_DELIVERY: "On the Way", 
  DELIVERED: "Delivered" 
};

const STATUS_COLORS = {
  PLACED: "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-500/10",
  ACCEPTED: "bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-4 ring-amber-500/10",
  PREPARING: "bg-orange-500 text-white shadow-md shadow-orange-500/20 ring-4 ring-orange-500/10",
  ASSIGNED: "bg-yellow-500 text-white shadow-md shadow-yellow-500/20 ring-4 ring-yellow-500/10",
  OUT_FOR_DELIVERY: "bg-sky-500 text-white shadow-md shadow-sky-500/20 ring-4 ring-sky-500/10",
  DELIVERED: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10",
  CANCELLED: "bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-4 ring-rose-500/10",
  REJECTED: "bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-4 ring-rose-500/10",
};

const CustomerOrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiClient.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const currentStep = useMemo(() => {
    if (!order) return -1;
    if (order.orderStatus === "CANCELLED" || order.orderStatus === "REJECTED") return -1;
    return STEPS.indexOf(order.orderStatus);
  }, [order]);

  const deliveryCoords = useMemo(() => {
    if (!order?.deliveryAddress?.latitude || !order?.deliveryAddress?.longitude) return null;
    return [order.deliveryAddress.latitude, order.deliveryAddress.longitude];
  }, [order]);

  if (loading && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading tracking dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-white">
        <div className="text-rose-500 text-3xl mb-2">⚠️</div>
        <h2 className="text-base font-bold text-slate-800">Tracking Error</h2>
        <p className="text-slate-400 text-xs max-w-xs mt-1">{error}</p>
        <Link to="/orders" className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer">Back to Orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-white">
        <div className="text-slate-400 text-3xl mb-2">🔍</div>
        <h2 className="text-base font-bold text-slate-800">Order Not Found</h2>
        <p className="text-slate-400 text-xs mt-1">We couldn't locate this order in our system.</p>
        <Link to="/orders" className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer">Back to Orders</Link>
      </div>
    );
  }

  const addr = order.deliveryAddress || {};
  const isCancelled = order.orderStatus === "CANCELLED" || order.orderStatus === "REJECTED";
  const isDelivered = order.orderStatus === "DELIVERED";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-16">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block">Live Delivery tracker</span>
            <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
              STATUS_COLORS[order.orderStatus] || "bg-slate-500 text-white"
            }`}>
              {order.orderStatus?.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Order #{order.orderId}</h1>
          <p className="text-slate-400 text-xs mt-1.5">{order.orderTime ? new Date(order.orderTime).toLocaleString() : ""}</p>
        </div>
        <Link to="/orders" className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer self-start sm:self-center shrink-0">
          ← Back to Orders
        </Link>
      </div>

      {isCancelled && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-8 text-center">
          <div className="text-4xl mb-2">❌</div>
          <h2 className="text-lg font-black text-rose-700">Order {order.orderStatus}</h2>
          <p className="text-rose-600/80 text-xs mt-1">This order has been {order.orderStatus.toLowerCase()} by the system or merchant.</p>
        </div>
      )}

      {isDelivered && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 mb-8 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-lg font-black text-emerald-700">Order Delivered!</h2>
          <p className="text-emerald-600/80 text-xs mt-1">Your meal has arrived. Bon appétit!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Order Details */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Invoice details</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-400">Order Status</span>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${
                  isCancelled ? "bg-rose-50 text-rose-700 border-rose-100" : isDelivered ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"
                }`}>
                  {order.orderStatus?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-400">Merchant Name</span>
                <span className="text-xs font-bold text-slate-800">{order.restaurantName || `#${order.restaurantId}`}</span>
              </div>
              {order.deliveryPartnerId && (
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400">Delivery Partner</span>
                  <span className="text-xs font-bold text-slate-800">{order.deliveryPartnerName || `#${order.deliveryPartnerId}`}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50 text-emerald-600 font-semibold">
                  <span className="text-xs">Discount {order.promoCode ? `(${order.promoCode})` : ""}</span>
                  <span className="text-xs">-₹{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {order.tipAmount > 0 && (
                <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-xs font-semibold text-slate-400">Driver Tip</span>
                  <span className="text-xs font-bold text-slate-800">₹{Number(order.tipAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs font-semibold text-slate-400">Total Charged</span>
                <span className="text-sm font-black text-slate-900">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {Array.isArray(order.orderItems) && order.orderItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Items Ordered</div>
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

        {/* Delivery Address & Map */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Delivery destination</div>
          <div className="space-y-1.5 text-xs text-slate-600 mb-5">
            <div><span className="font-semibold text-slate-400">Address:</span> <span className="font-bold text-slate-800">{addr.street || "—"}</span></div>
            <div><span className="font-semibold text-slate-400">City / State:</span> <span className="font-bold text-slate-800">{addr.city || "—"}{addr.state ? `, ${addr.state}` : ""}</span></div>
            <div><span className="font-semibold text-slate-400">Postal Code:</span> <span className="font-bold text-slate-800">{addr.postalCode || "—"}</span></div>
          </div>
          {deliveryCoords && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 mt-4" style={{ height: 220 }}>
              <MapContainer center={deliveryCoords} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <Marker position={deliveryCoords}><Popup>Delivery Address</Popup></Marker>
              </MapContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] font-bold text-slate-400 tracking-wider uppercase">
        Live Refresh active • Last checked: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default CustomerOrderTracking;
