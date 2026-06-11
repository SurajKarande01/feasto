import apiClient from "../../services/api/apiClient";
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

  const weekEarnings = useMemo(() => {
    const result = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const dayOfWeek = now.getDay();
    activeOrders.filter(o => o.orderStatus === "DELIVERED").forEach(o => {
      try {
        const d = new Date(o.orderTime);
        const diff = Math.floor((now - d) / 86400000);
        if (diff >= 0 && diff < 7) {
          const idx = (dayOfWeek - diff + 7) % 7;
          const monIdx = idx === 0 ? 6 : idx - 1;
          result[monIdx] += (o.totalAmount || 0);
        }
      } catch { /* ignore */ }
    });
    return result;
  }, [activeOrders]);

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
      await apiClient.put(
        `/delivery-partners/${id}/availability`,
        payload
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
      const url = `/delivery-partners/${id}/orders`;
      const res = await apiClient.get(url);
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
      await apiClient.put(`/orders/${orderId}/status`, null, { params: { orderStatus: "OUT_FOR_DELIVERY" } });
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
            await apiClient.put(`/delivery-partners/${id}/availability`, {
              available: true,
              currentLocation: { latitude: loc.latitude, longitude: loc.longitude },
            });
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
    loadActiveOrders();
  }, [loadActiveOrders]);

  useEffect(() => {
    const today = new Date().toDateString();
    const todayOrders = activeOrders.filter(o => {
      try { return new Date(o.orderTime).toDateString() === today; } catch { return false; }
    });
    const delivered = todayOrders.filter(o => o.orderStatus === "DELIVERED");
    const earnings = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const active = activeOrders.filter(o => !["DELIVERED","CANCELLED","REJECTED"].includes(o.orderStatus));
    setStats({ earningsToday: Math.round(earnings), completedToday: delivered.length, activeCount: active.length });
  }, [activeOrders]);

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
              await apiClient.put(`/delivery-partners/${id}/availability`, {
                available: true,
                currentLocation: { latitude: loc.latitude, longitude: loc.longitude },
              });
            } catch { console.debug("availability update failed"); }
          }
        }, 5000);
      })();
    }
  }, [activeOrders, ridingOrderId, resolvePartnerId]);

  return (
    <div className="min-h-screen pb-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
          <div>
            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Rider cockpit</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Hello{profile?.name ? ", " + profile.name : ""}</h1>
            <p className="text-slate-500 text-sm mt-1">Stay safe and deliver on time</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <button 
              onClick={() => handleAvailabilityChange(true)}
              disabled={availLoading}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                online 
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Go Online
            </button>
            <button 
              onClick={() => handleAvailabilityChange(false)}
              disabled={availLoading}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                !online 
                  ? "bg-slate-500 text-white shadow-md shadow-slate-500/20" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Go Offline
            </button>
          </div>
        </div>

        {(availError || locError) && (
          <div className="text-xs font-semibold text-rose-500 bg-rose-50 p-3 rounded-2xl border border-rose-100 mb-6">
            {availError || locError}
          </div>
        )}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-rose-50/30 border border-rose-100/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(244,63,94,0.01)]">
            <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">Earnings Today</div>
            <div className="text-3xl font-black text-rose-600 mt-1.5">₹{stats.earningsToday}</div>
          </div>
          <div className="bg-emerald-50/30 border border-emerald-100/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(16,185,129,0.01)]">
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Completed Today</div>
            <div className="text-3xl font-black text-emerald-600 mt-1.5">{stats.completedToday}</div>
          </div>
          <div className="bg-blue-50/30 border border-blue-100/40 rounded-2xl p-5 shadow-[0_8px_30px_rgba(59,130,246,0.01)]">
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">Active Orders</div>
            <div className="text-3xl font-black text-blue-600 mt-1.5">{stats.activeCount}</div>
          </div>
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Rating</div>
            <div className="text-3xl font-black text-slate-950 mt-1.5">{profile?.rating ?? "—"}</div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Deliveries</h2>
              <button 
                onClick={() => loadActiveOrders()} 
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Refresh List
              </button>
            </div>

            {ordersLoading && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-6 h-6 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 font-semibold text-[10px] mt-2 uppercase tracking-wider">Fetching…</span>
              </div>
            )}
            
            {ordersError && (
              <div className="text-xs font-semibold text-rose-500 bg-rose-50 p-3 rounded-2xl border border-rose-100 mt-4">
                {ordersError}
              </div>
            )}

            <div className="divide-y divide-slate-50 mt-2">
              {activeOrders.map((o) => {
                const itemsCount = Array.isArray(o?.orderItems) ? o.orderItems.reduce((acc, it) => acc + (it?.quantity || 0), 0) : 0;
                const addressLine = o?.deliveryAddress ? `${o.deliveryAddress.street || ""}, ${o.deliveryAddress.city || ""}`.trim() : "-";
                const dest = o?.deliveryAddress?.latitude && o?.deliveryAddress?.longitude ? { lat: o.deliveryAddress.latitude, lng: o.deliveryAddress.longitude } : null;
                return (
                  <div key={o.orderId} className="py-5 first:pt-2 last:pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          Order #{o.orderId} • <span className="text-rose-500 font-black">₹{Number(o.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1">Items {itemsCount} • Destination: {addressLine}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">User #{o.userId} • Rest #{o.restaurantId}</div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${
                          o.orderStatus === "DELIVERED" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : o.orderStatus === "OUT_FOR_DELIVERY" 
                            ? "bg-sky-50 text-sky-700 border-sky-100" 
                            : "bg-yellow-50 text-yellow-700 border-yellow-100"
                        }`}>
                          {o.orderStatus}
                        </span>

                        {o.orderStatus === "OUT_FOR_DELIVERY" && dest && (
                          <label className="inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={!!mapOpen[o.orderId]}
                              onChange={() => toggleMap(o.orderId)}
                            />
                            <div className="w-9 h-5.5 bg-slate-200 rounded-full relative transition-colors peer-checked:bg-rose-500">
                              <div className="absolute top-0.5 left-0.5 h-4.5 w-4.5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-3.5" />
                            </div>
                            <span className="ml-2 text-xs font-bold text-slate-500">{mapOpen[o.orderId] ? "Map active" : "View Map"}</span>
                          </label>
                        )}
                        {o.orderStatus !== "OUT_FOR_DELIVERY" && o.orderStatus !== "DELIVERED" && (
                          <button 
                            onClick={() => handleOutForDelivery(o.orderId)} 
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-[10px] font-extrabold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
                          >
                            Out for delivery
                          </button>
                        )}
                      </div>
                    </div>

                    {o.orderStatus === "OUT_FOR_DELIVERY" && dest && mapOpen[o.orderId] && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100">
                        <DeliveryMap origin={riderPosition || null} destination={dest} height={260} />
                      </div>
                    )}
                  </div>
                );
              })}

              {!activeOrders.length && !ordersLoading && (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">No active orders assigned to you.</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Today’s Heatmap</h2>
              <div className="h-48 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50/20 border border-rose-100/30 flex flex-col items-center justify-center p-4 text-center">
                <span className="text-3xl mb-2">🔥</span>
                <span className="text-xs font-bold text-slate-700">Central Business District</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">High-demand area highlighted</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">
              Tip: Stay near central hub to receive assignments faster.
            </div>
          </div>

        </div>

        {/* Weekly & Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">This Week Earnings</h2>
            <div className="flex items-end gap-2.5 h-36">
              {weekEarnings.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="w-full bg-rose-500 rounded-t-lg transition-all duration-300 hover:opacity-90" style={{ height: `${Math.max(5, Math.min(100, (v / 2000) * 100))}%` }} />
                  <span className="text-[9px] font-bold text-slate-400 mt-2">{["M","T","W","T","F","S","S"][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Active Shift</h2>
              <div className="space-y-1 text-xs font-semibold text-slate-500">
                <div>Shift Started: <span className="text-slate-800 font-bold">10:00 AM</span></div>
                <div>Expected End: <span className="text-slate-800 font-bold">06:00 PM</span></div>
              </div>
            </div>
            <button className="w-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer mt-4">
              End Shift
            </button>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Quick Navigation</h2>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => navigate("/assigned-orders")} className="px-3 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm">
                  Assignments
                </button>
                <button onClick={() => navigate("/delivery-profile")} className="px-3 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm">
                  Rider Profile
                </button>
              </div>
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center pt-4">
              Keep app open in background for real-time tracking
            </div>
          </div>
        </div>
      
      </div>
    </div>
  );
};

export default DeliveryDashboard;
