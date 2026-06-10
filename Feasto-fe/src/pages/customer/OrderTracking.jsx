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

const STEPS = ["PLACED","ACCEPTED","PREPARING","ASSIGNED","OUT_FOR_DELIVERY","DELIVERED"];
const STEP_LABELS = { PLACED:"Order Placed", ACCEPTED:"Restaurant Accepted", PREPARING:"Being Prepared", ASSIGNED:"Rider Assigned", OUT_FOR_DELIVERY:"On the Way", DELIVERED:"Delivered" };

const CustomerOrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const res = await apiClient.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load order");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchOrder(); const interval = setInterval(fetchOrder, 10000); return () => clearInterval(interval); }, [fetchOrder]);

  const currentStep = useMemo(() => {
    if (!order) return -1;
    if (order.orderStatus === "CANCELLED" || order.orderStatus === "REJECTED") return -1;
    return STEPS.indexOf(order.orderStatus);
  }, [order]);

  const deliveryCoords = useMemo(() => {
    if (!order?.deliveryAddress?.latitude || !order?.deliveryAddress?.longitude) return null;
    return [order.deliveryAddress.latitude, order.deliveryAddress.longitude];
  }, [order]);

  if (loading && !order) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-500">Loading order tracking…</div></div>;
  if (error) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-red-500">{error}</div></div>;
  if (!order) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-500">Order not found</div></div>;

  const addr = order.deliveryAddress || {};
  const isCancelled = order.orderStatus === "CANCELLED" || order.orderStatus === "REJECTED";
  const isDelivered = order.orderStatus === "DELIVERED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderId}</h1>
          <p className="text-sm text-gray-500 mt-1">{order.orderTime ? new Date(order.orderTime).toLocaleString() : ""}</p>
        </div>
        <Link to="/orders" className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">← Back to Orders</Link>
      </div>

      {/* Status Stepper */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Order Progress</h2>
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {idx > 0 && <div className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${idx <= currentStep ? "bg-emerald-500" : "bg-gray-200"}`} style={{ zIndex: 0 }} />}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 ${isCompleted ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"} ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}>
                    {isCompleted && idx < currentStep ? "✓" : idx + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center ${isCurrent ? "font-bold text-emerald-700" : "text-gray-500"}`}>{STEP_LABELS[step]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
          <div className="text-3xl mb-2">❌</div>
          <h2 className="text-lg font-bold text-red-700">Order {order.orderStatus}</h2>
          <p className="text-sm text-red-600 mt-1">This order has been {order.orderStatus.toLowerCase()}.</p>
        </div>
      )}

      {isDelivered && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h2 className="text-lg font-bold text-emerald-700">Order Delivered!</h2>
          <p className="text-sm text-emerald-600 mt-1">Your order has been delivered successfully. Enjoy your meal!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Order Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`font-bold ${isCancelled ? "text-red-600" : isDelivered ? "text-emerald-600" : "text-blue-600"}`}>{order.orderStatus?.replace(/_/g, " ")}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount</span><span className="font-bold text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Restaurant ID</span><span className="text-gray-700">#{order.restaurantId}</span></div>
            {order.deliveryPartnerId && <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery Partner</span><span className="text-gray-700">#{order.deliveryPartnerId}</span></div>}
          </div>
          {Array.isArray(order.orderItems) && order.orderItems.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Items Ordered</h3>
              <div className="space-y-2">
                {order.orderItems.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">{it.menuItemName || `Item #${it.menuItemId}`} × {it.quantity}</span>
                    <span className="text-gray-900 font-medium">₹{Number((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delivery Address + Map */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Delivery Location</h2>
          <div className="space-y-2 mb-4 text-sm">
            <div><span className="text-gray-500">Street:</span> <span className="text-gray-900">{addr.street || "—"}</span></div>
            <div><span className="text-gray-500">City:</span> <span className="text-gray-900">{addr.city || "—"}</span></div>
            <div><span className="text-gray-500">State:</span> <span className="text-gray-900">{addr.state || "—"}</span></div>
            <div><span className="text-gray-500">Postal Code:</span> <span className="text-gray-900">{addr.postalCode || "—"}</span></div>
          </div>
          {deliveryCoords && (
            <div className="rounded-xl overflow-hidden border" style={{ height: 260 }}>
              <MapContainer center={deliveryCoords} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <Marker position={deliveryCoords}><Popup>Delivery Location</Popup></Marker>
              </MapContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">Auto-refreshing every 10 seconds • Last updated: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default CustomerOrderTracking;
