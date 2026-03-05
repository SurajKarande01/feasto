import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeliveryMap from "../../components/delivery/DeliveryMap";

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const profile = useMemo(() => {
    try {
      const raw = localStorage.getItem("deliveryProfile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [online, setOnline] = useState(true);
  const [stats, setStats] = useState({ earningsToday: 0, completedToday: 0, activeCount: 0 });
  const [activeOrders, setActiveOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const weekEarnings = [650, 720, 480, 910, 840, 0, 0];
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState("");
  const [locError, setLocError] = useState("");
  const [mapOpen, setMapOpen] = useState({});
  const toggleMap = useCallback((orderId) => {
    setMapOpen((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  }, []);
  const [ridingOrderId, setRidingOrderId] = useState(null);
  const [riderPosition, setRiderPosition] = useState(null);
  const rideTimerRef = useRef(null);

  const getBrowserLocationOnce = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

  const resolvePartnerId = useCallback(() => {
    return (
      profile?.id ||
      profile?.partnerId ||
      profile?.deliveryPartnerId
    );
  }, [profile]);

  const getCurrentLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocError("Geolocation is not supported by your browser");
        resolve({ latitude: null, longitude: null });
        return;
      }
      setLocError("");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          setLocError("Unable to get location");
          resolve({ latitude: null, longitude: null });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const handleAvailabilityChange = async (newAvailable) => {
    if (availLoading) return;
    setAvailError("");
    setAvailLoading(true);
    try {
      const loc = await getCurrentLocation();
      const payload = {
        available: newAvailable,
        currentLocation: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
      };
      const id = resolvePartnerId();
      await axios.put(
        `http://localhost:8080/api/delivery-partners/${id}/availability`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      setOnline(newAvailable);
    } catch (err) {
      const msg = err?.request?.responseText || err.message || "Failed to update availability";
      setAvailError(msg);
    } finally {
      setAvailLoading(false);
    }
  };

  const loadActiveOrders = useCallback(async () => {
    try {
      setOrdersError("");
      setOrdersLoading(true);
      const id = resolvePartnerId();
      if (!id) {
        setActiveOrders([]);
        setStats((s) => ({ ...s, activeCount: 0 }));
        return;
      }
      const url = `http://localhost:8080/api/delivery-partners/${id}/orders`;
      const res = await axios.get(url);
      const data = Array.isArray(res?.data) ? res.data : [];
      setActiveOrders(data);
      setStats((s) => ({ ...s, activeCount: data.length }));
    } catch (e) {
      const msg = e?.request?.responseText || e.message || "Failed to load active orders";
      setOrdersError(msg);
      setActiveOrders([]);
      setStats((s) => ({ ...s, activeCount: 0 }));
    } finally {
      setOrdersLoading(false);
    }
  }, [resolvePartnerId]);

  const handleOutForDelivery = async (orderId) => {
    try {
      await axios.put(`http://localhost:8080/api/orders/${orderId}/status`, null, { params: { orderStatus: "OUT_FOR_DELIVERY" } });
      await loadActiveOrders();
      setRidingOrderId(orderId);
      const id = resolvePartnerId();
      const first = await getBrowserLocationOnce();
      if (first.latitude && first.longitude) {
        setRiderPosition({ lat: first.latitude, lng: first.longitude });
      }
      if (rideTimerRef.current) {
        clearInterval(rideTimerRef.current);
        rideTimerRef.current = null;
      }
      rideTimerRef.current = setInterval(async () => {
        const loc = await getBrowserLocationOnce();
        if (loc.latitude && loc.longitude) {
          setRiderPosition({ lat: loc.latitude, lng: loc.longitude });
          try {
            await axios.put(`http://localhost:8080/api/delivery-partners/${id}/availability`, {
              available: true,
              currentLocation: { latitude: loc.latitude, longitude: loc.longitude },
            }, { headers: { "Content-Type": "application/json" } });
          } catch { console.debug("availability update failed"); }
        }
      }, 5000);
    } catch {
      setOrdersError("Failed to mark as out for delivery");
    }
  };

  useEffect(() => {
    return () => {
      if (rideTimerRef.current) {
        clearInterval(rideTimerRef.current);
        rideTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setStats({ earningsToday: 820, completedToday: 7, activeCount: 0 });
    loadActiveOrders();
  }, [loadActiveOrders]);

  // If page refreshes and there is an order already OUT_FOR_DELIVERY, show its map and resume updates
  useEffect(() => {
    const current = activeOrders.find((o) => o.orderStatus === "OUT_FOR_DELIVERY");
    if (!current) return;
    if (ridingOrderId !== current.orderId) {
      setRidingOrderId(current.orderId);
      (async () => {
        const first = await getBrowserLocationOnce();
        if (first.latitude && first.longitude) {
          setRiderPosition({ lat: first.latitude, lng: first.longitude });
        }
        if (rideTimerRef.current) {
          clearInterval(rideTimerRef.current);
          rideTimerRef.current = null;
        }
        const id = resolvePartnerId();
        rideTimerRef.current = setInterval(async () => {
          const loc = await getBrowserLocationOnce();
          if (loc.latitude && loc.longitude) {
            setRiderPosition({ lat: loc.latitude, lng: loc.longitude });
            try {
              await axios.put(`http://localhost:8080/api/delivery-partners/${id}/availability`, {
                available: true,
                currentLocation: { latitude: loc.latitude, longitude: loc.longitude },
              }, { headers: { "Content-Type": "application/json" } });
            } catch { console.debug("availability update failed"); }
          }
        }, 5000);
      })();
    }
  }, [activeOrders, ridingOrderId, resolvePartnerId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hello{profile?.name ? ", " + profile.name : ""}</h1>
          <div className="text-gray-600 text-sm">Stay safe and deliver on time</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              id="status-online"
              type="checkbox"
              checked={online}
              onChange={() => handleAvailabilityChange(true)}
              disabled={availLoading}
              className="h-4 w-4"
            />
            <label htmlFor="status-online" className="text-sm">Online</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="status-offline"
              type="checkbox"
              checked={!online}
              onChange={() => handleAvailabilityChange(false)}
              disabled={availLoading}
              className="h-4 w-4"
            />
            <label htmlFor="status-offline" className="text-sm">Offline</label>
          </div>
          <span className={`text-sm px-2 py-1 rounded ${online ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}>{online ? "Online" : "Offline"}</span>
        </div>
      </div>

      {(availLoading || availError || locError) && (
        <div className="text-xs text-gray-600">{availLoading ? "Updating status…" : availError || locError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-sm text-gray-600">Earnings Today</div>
          <div className="mt-2 text-2xl font-semibold">₹{stats.earningsToday}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-sm text-gray-600">Completed Today</div>
          <div className="mt-2 text-2xl font-semibold">{stats.completedToday}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-sm text-gray-600">Active Orders</div>
          <div className="mt-2 text-2xl font-semibold">{stats.activeCount}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-sm text-gray-600">Rating</div>
          <div className="mt-2 text-2xl font-semibold">4.8</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <>
        <div className="lg:col-span-2 p-4 rounded-lg border bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active Deliveries</h2>
            <button onClick={() => loadActiveOrders()} className="text-sm px-2 py-1 rounded border">Refresh</button>
          </div>
          {ordersLoading && (
            <div className="mt-3 text-sm text-gray-600">Loading…</div>
          )}
          {ordersError && (
            <div className="mt-3 text-sm text-red-600">{ordersError}</div>
          )}
          <div className="mt-3 divide-y">
            {activeOrders.map((o) => {
              const itemsCount = Array.isArray(o?.orderItems) ? o.orderItems.reduce((acc, it) => acc + (it?.quantity || 0), 0) : 0;
              const addressLine = o?.deliveryAddress ? `${o.deliveryAddress.street || ""}, ${o.deliveryAddress.city || ""}`.trim() : "-";
              const dest = o?.deliveryAddress?.latitude && o?.deliveryAddress?.longitude ? { lat: o.deliveryAddress.latitude, lng: o.deliveryAddress.longitude } : null;
              return (
                <div key={o.orderId} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">#{o.orderId} • ₹{Number(o.totalAmount || 0).toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Items {itemsCount} • To {addressLine}</div>
                      <div className="text-xs text-gray-500">Status {o.orderStatus} • User {o.userId} • Restaurant {o.restaurantId}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${o.orderStatus === "DELIVERED" ? "bg-green-50 text-green-700" : o.orderStatus === "OUT_FOR_DELIVERY" ? "bg-sky-50 text-sky-700" : "bg-yellow-50 text-yellow-700"}`}>{o.orderStatus}</span>
                      {o.orderStatus === "OUT_FOR_DELIVERY" && dest && (
                        <label className="inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={!!mapOpen[o.orderId]}
                            onChange={() => toggleMap(o.orderId)}
                          />
                          <div className="w-10 h-6 bg-gray-200 rounded-full relative transition-colors peer-checked:bg-sky-500">
                            <div className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                          </div>
                          <span className="ml-2 text-sm">{mapOpen[o.orderId] ? "Hide map" : "Show map"}</span>
                        </label>
                      )}
                      {o.orderStatus !== "OUT_FOR_DELIVERY" && o.orderStatus !== "DELIVERED" && (
                        <button onClick={() => handleOutForDelivery(o.orderId)} className="text-sm px-3 py-1 rounded bg-indigo-600 text-white">Out for delivery</button>
                      )}
                    </div>
                  </div>
                  {(o.orderStatus === "OUT_FOR_DELIVERY") && dest && mapOpen[o.orderId] && (
                    <div className="mt-3">
                      <DeliveryMap origin={riderPosition || null} destination={dest} height={260} />
                    </div>
                  )}
                </div>
              );
            })}
            {!activeOrders.length && !ordersLoading && (
              <div className="py-6 text-center text-gray-500 text-sm">No active orders</div>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-white">
          <h2 className="font-semibold">Today’s Heatmap</h2>
          <div className="mt-3 h-56 rounded bg-gradient-to-br from-blue-50 to-purple-50 border"></div>
          <div className="mt-2 text-xs text-gray-500">High-demand areas highlighted</div>
        </div>
        </>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-white">
          <h2 className="font-semibold">This Week Earnings</h2>
          <div className="mt-4 flex items-end gap-2 h-32">
            {weekEarnings.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-200 rounded" style={{ height: Math.max(8, (v / 1000) * 100) + "%" }} />
                <div className="text-xs text-gray-600 mt-1">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <h2 className="font-semibold">Shift</h2>
          <div className="mt-2 text-sm text-gray-700">Start: 10:00 AM</div>
          <div className="text-sm text-gray-700">End: 6:00 PM</div>
          <button className="mt-3 px-3 py-2 rounded border text-sm">End shift</button>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <h2 className="font-semibold">Quick Actions</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => navigate("/assigned-orders")} className="px-3 py-2 rounded border text-sm">Assigned</button>
            <button onClick={() => navigate("/delivery-profile")} className="px-3 py-2 rounded border text-sm">Profile</button>
          </div>
        </div>
      </div>
    
    </div>
  );
};

export default DeliveryDashboard;
