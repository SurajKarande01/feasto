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
    } finally { setLoading(false); }
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
            await apiClient.put(`/delivery-partners/${pid}/availability`, {
              available: true,
              currentLocation: { latitude: loc.lat, longitude: loc.lng },
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-500">Loading order details…</div></div>;
  if (error) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-red-500">{error}</div></div>;
  if (!order) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-500">Order not found</div></div>;

  const addr = order.deliveryAddress || {};
  const itemsCount = Array.isArray(order.orderItems) ? order.orderItems.reduce((a, it) => a + (it.quantity || 0), 0) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery #{order.orderId}</h1>
          <p className="text-sm text-gray-500 mt-1">Status: <span className="font-semibold">{order.orderStatus?.replace(/_/g, " ")}</span></p>
        </div>
        <Link to="/delivery-dashboard" className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">← Dashboard</Link>
      </div>

      {/* Map */}
      {destination && order.orderStatus === "OUT_FOR_DELIVERY" && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6">
          <DeliveryMap origin={riderPosition} destination={destination} height={350} />
        </div>
      )}

      {order.orderStatus === "DELIVERED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h2 className="text-lg font-bold text-emerald-700">Delivery Completed!</h2>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Order ID</span><span className="font-bold">#{order.orderId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Items</span><span className="font-medium">{itemsCount} item(s)</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">₹{Number(order.totalAmount || 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>User #{order.userId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Restaurant</span><span className="font-medium">{order.restaurantName || `#${order.restaurantId}`}</span></div>
          </div>
          {Array.isArray(order.orderItems) && order.orderItems.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {order.orderItems.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{it.menuItemName || `Item #${it.menuItemId}`} × {it.quantity}</span>
                  <span className="font-medium">₹{Number((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Delivery Address</h2>
          <div className="space-y-2 text-sm">
            <div>{addr.street || "—"}</div>
            <div>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ") || "—"}</div>
            <div>{addr.country || "—"}</div>
          </div>

          <div className="mt-6 space-y-3">
            {order.orderStatus === "ASSIGNED" && (
              <button onClick={() => handleStatusUpdate("OUT_FOR_DELIVERY")} className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                🛵 Start Delivery
              </button>
            )}
            {order.orderStatus === "OUT_FOR_DELIVERY" && (
              <button onClick={() => handleStatusUpdate("DELIVERED")} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
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
