import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../services/api/apiClient";

const getRestaurantId = () => {
  try {
    const raw = localStorage.getItem("restaurantProfile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.id ?? p?.restaurantId ?? null;
  } catch { return null; }
};

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

const RestaurantOrders = () => {
  const [ordersPage, setOrdersPage] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10,
    empty: true,
    first: true,
    last: true,
  });
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusTab, setStatusTab] = useState("PLACED");
  const [refreshTick, setRefreshTick] = useState(0);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const rid = getRestaurantId();
        if (!rid) { setError("Restaurant profile not found"); setLoading(false); return; }
        const res = await apiClient.get(`/restaurants/${rid}/orders`, {
          params: { page, limit, status: statusTab },
          signal: controller.signal,
        });
        const data = res.data;
        setOrdersPage({
          content: Array.isArray(data?.content) ? data.content : [],
          totalPages: data?.totalPages ?? 0,
          totalElements: data?.totalElements ?? 0,
          number: data?.number ?? page,
          size: data?.size ?? limit,
          empty: !!data?.empty,
          first: !!data?.first,
          last: !!data?.last,
        });
      } catch (e) {
        if (e.name !== "AbortError")
          setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    return () => controller.abort();
  }, [page, limit, statusTab, refreshTick]);

  const filtered = useMemo(() => {
    return ordersPage.content;
  }, [ordersPage.content]);

  const loadAvailablePartners = async () => {
    try {
      setPartnersLoading(true);
      const res = await apiClient.get("/delivery-partners/available");
      setAvailablePartners(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(e.message || "Could not fetch delivery partners");
    } finally {
      setPartnersLoading(false);
    }
  };

  const handleAutoAssign = async (orderId) => {
    try {
      await apiClient.post(`/orders/${orderId}/auto-assign-delivery-partner`);
      toast.success("Delivery partner auto-assigned");
      setRefreshTick((t) => t + 1);
    } catch (e) {
      toast.error(e.message || "Auto assignment failed");
    }
  };

  const handleManualAssign = async (orderId) => {
    const partnerId = selectedPartner[orderId];
    if (!partnerId) {
      toast.info("Please select a delivery partner");
      return;
    }
    try {
      await apiClient.post(`/orders/${orderId}/assign-delivery-partner`, null, { params: { deliveryPartnerId: partnerId } });
      toast.success("Delivery partner assigned successfully");
      setRefreshTick((t) => t + 1);
    } catch (e) {
      toast.error(e.message || "Manual assignment failed");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, null, { params: { orderStatus: newStatus } });
      toast.success(`Order status updated to ${newStatus}`);
      setRefreshTick((t) => t + 1);
    } catch (e) {
      toast.error(e.message || "Failed to update order status");
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
          <div>
            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Order console</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Restaurant Orders</h1>
            <p className="text-slate-500 text-sm mt-1">Review live, accepted, preparing, or delivered orders</p>
          </div>
          <div className="flex gap-3 items-center shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setPage(0);
                setLimit(parseInt(e.target.value, 10));
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 transition-all cursor-pointer shadow-sm"
            >
              <option value={10}>10 Orders</option>
              <option value={20}>20 Orders</option>
              <option value={50}>50 Orders</option>
            </select>
          </div>
        </div>

        {/* Status Group Tabs */}
        <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
          <div className="flex flex-col gap-2 bg-white border border-slate-100/60 p-3 rounded-2xl flex-1 min-w-[200px]">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Customer Action</div>
            <div className="flex gap-2">
              {["PLACED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer flex-1 border ${
                    statusTab === s 
                      ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
                      : "bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                  onClick={() => {
                    setPage(0);
                    setStatusTab(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-white border border-slate-100/60 p-3 rounded-2xl flex-[2] min-w-[280px]">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Kitchen / Merchant Workflow</div>
            <div className="flex gap-2 flex-wrap">
              {["ACCEPTED", "REJECTED", "PREPARING", "ASSIGNED"].map((s) => (
                <button
                  key={s}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer flex-1 border ${
                    statusTab === s 
                      ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
                      : "bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                  onClick={() => {
                    setPage(0);
                    setStatusTab(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-white border border-slate-100/60 p-3 rounded-2xl flex-1 min-w-[200px]">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Logistics / Rider Status</div>
            <div className="flex gap-2">
              {["OUT_FOR_DELIVERY", "DELIVERED"].map((s) => (
                <button
                  key={s}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer flex-1 border ${
                    statusTab === s 
                      ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
                      : "bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                  onClick={() => {
                    setPage(0);
                    setStatusTab(s);
                  }}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Fetching orders…</span>
          </div>
        )}
        {error && <div className="text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl py-4 font-semibold text-sm">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-base font-bold text-slate-700">No orders found</h3>
            <p className="text-slate-400 text-xs mt-1">There are no orders matching status: <span className="font-extrabold text-rose-500">{statusTab}</span></p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">Order ID</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">User ID</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">Items</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">Amount</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">Status</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">Order Time</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">City</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((o) => {
                  const dateStr = o?.orderTime ? new Date(o.orderTime).toLocaleString() : "-";
                  const itemsCount = Array.isArray(o?.orderItems) ? o.orderItems.reduce((acc, it) => acc + (it?.quantity || 0), 0) : 0;
                  const city = o?.deliveryAddress?.city || "-";
                  return (
                    <tr key={o.orderId} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 text-xs font-extrabold text-slate-900">#{o.orderId}</td>
                      <td className="p-4 text-xs font-bold text-slate-500">#{o.userId}</td>
                      <td className="p-4 text-xs font-semibold text-slate-700">{itemsCount} qty</td>
                      <td className="p-4 text-sm font-black text-slate-900">₹{Number(o.totalAmount || 0).toFixed(2)}</td>
                      <td className="p-4 text-xs">
                        <StatusBadge status={o.orderStatus} />
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-400">{dateStr}</td>
                      <td className="p-4 text-xs font-bold text-slate-600">{city}</td>
                      <td className="p-4 text-xs">
                        <div className="flex flex-col gap-2">
                          {/* Main workflow actions */}
                          {o.orderStatus === "PLACED" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(o.orderId, "ACCEPTED")}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-extrabold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/20 cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(o.orderId, "REJECTED")}
                                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-extrabold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {o.orderStatus === "ACCEPTED" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(o.orderId, "PREPARING")}
                                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-extrabold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
                              >
                                Start Preparing
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(o.orderId, "CANCELLED")}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-xl transition-all duration-200 cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            </div>
                          )}

                          {(o.orderStatus === "PREPARING" || o.orderStatus === "ASSIGNED") && (
                            <div className="space-y-2">
                              {o.orderStatus === "ASSIGNED" && (
                                <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                  <span>🚴 Assigned: {o.deliveryPartnerName || `Partner #${o.deliveryPartnerId}`}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 items-center">
                                <button
                                  onClick={() => handleAutoAssign(o.orderId)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm"
                                >
                                  {o.orderStatus === "ASSIGNED" ? "Auto Change" : "Auto Assign"}
                                </button>

                                <select
                                  disabled={partnersLoading}
                                  value={selectedPartner[o.orderId] || ""}
                                  onClick={() => {
                                    if (availablePartners.length === 0) {
                                      loadAvailablePartners();
                                    }
                                  }}
                                  onChange={(e) =>
                                    setSelectedPartner((prev) => ({
                                      ...prev,
                                      [o.orderId]: e.target.value,
                                    }))
                                  }
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-rose-500 transition-all cursor-pointer"
                                >
                                  <option value="" disabled>
                                    {partnersLoading ? "Loading..." : "Select Partner"}
                                  </option>
                                  {availablePartners.map((p) => (
                                    <option
                                      key={p?.id || p?.deliveryPartnerId}
                                      value={p?.id || p?.deliveryPartnerId}
                                    >
                                      {p?.name || p?.fullName || `Partner ${p?.id || p?.deliveryPartnerId}`}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handleManualAssign(o.orderId)}
                                  disabled={!selectedPartner[o.orderId]}
                                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {o.orderStatus === "ASSIGNED" ? "Reassign" : "Assign"}
                                </button>

                                <button
                                  onClick={() => handleUpdateStatus(o.orderId, "CANCELLED")}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm"
                                >
                                  Cancel Order
                                </button>
                              </div>
                            </div>
                          )}

                          {!["PLACED", "ACCEPTED", "PREPARING", "ASSIGNED"].includes(o.orderStatus) && (
                            <span className="text-slate-400 font-bold">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-1">
            <div className="text-xs font-semibold text-slate-400">
              Showing {filtered.length} of {ordersPage.totalElements} orders
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={loading || ordersPage.first}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-xs font-extrabold text-slate-500 px-1">
                Page {ordersPage.number + 1} of {Math.max(ordersPage.totalPages, 1)}
              </span>
              <button
                onClick={() => setPage((p) => (ordersPage.last ? p : p + 1))}
                disabled={loading || ordersPage.last}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
