import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDeliveryPartnerById, getDeliveryNotifications, markAllDeliveryNotificationsRead } from "../../services/api/deliveryService";
import { toast } from "react-toastify";

const getPartnerId = () => {
  try {
    const raw = localStorage.getItem("deliveryProfile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.id || p?.partnerId || p?.deliveryPartnerId || null;
  } catch { return null; }
};

const DeliveryProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const loadData = useCallback(async () => {
    const id = getPartnerId();
    if (!id) { setLoading(false); return; }
    setLoading(true);
    try {
      const raw = localStorage.getItem("deliveryProfile");
      if (raw) setProfile(JSON.parse(raw));
      try { const apiProfile = await getDeliveryPartnerById(id); setProfile(apiProfile); } catch { /* use localStorage */ }
      try { const notifs = await getDeliveryNotifications(id); setNotifications(Array.isArray(notifs) ? notifs : []); } catch { /* no notifs */ }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMarkAllRead = async () => {
    const id = getPartnerId();
    if (!id) return;
    try { await markAllDeliveryNotificationsRead(id); setNotifications(n => n.map(x => ({ ...x, isRead: true }))); toast.success("Notifications marked as read"); }
    catch { toast.error("Failed to mark notifications"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/welcome"); };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-500">Loading profile…</div></div>;
  if (!profile) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-500">Please login to view your profile</div></div>;

  const loc = profile.currentLocation || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {(profile.name || "R").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name || "Delivery Partner"}</h1>
            <p className="text-gray-500 text-sm">{profile.email}</p>
            {profile.phoneNumber && <p className="text-gray-500 text-sm">{profile.phoneNumber}</p>}
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${profile.isAvailable || profile.available ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
              {profile.isAvailable || profile.available ? "Online" : "Offline"}
            </span>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-200 hover:bg-red-100">Logout</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {["profile", "notifications"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize ${activeTab === tab ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{tab}</button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-500">Full Name</label><div className="font-medium text-gray-900 mt-1">{profile.name || "—"}</div></div>
            <div><label className="text-sm text-gray-500">Email</label><div className="font-medium text-gray-900 mt-1">{profile.email || "—"}</div></div>
            <div><label className="text-sm text-gray-500">Phone</label><div className="font-medium text-gray-900 mt-1">{profile.phoneNumber || "—"}</div></div>
            <div><label className="text-sm text-gray-500">Vehicle Type</label><div className="font-medium text-gray-900 mt-1">{profile.vehicleType || "—"}</div></div>
            <div><label className="text-sm text-gray-500">Partner ID</label><div className="font-medium text-gray-900 mt-1">{profile.id || profile.deliveryPartnerId || "—"}</div></div>
            <div><label className="text-sm text-gray-500">Availability</label><div className="font-medium text-gray-900 mt-1">{profile.isAvailable || profile.available ? "Available" : "Unavailable"}</div></div>
          </div>
          {(loc.latitude || loc.longitude) && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Known Location</h3>
              <p className="text-sm text-gray-600">Lat: {loc.latitude}, Lon: {loc.longitude}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            {notifications.length > 0 && <button onClick={handleMarkAllRead} className="text-sm text-blue-600 hover:underline">Mark all read</button>}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-10"><div className="text-5xl mb-3">🔔</div><p className="text-gray-500">No notifications</p></div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.notificationId || n.id} className={`p-4 rounded-xl border ${n.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-200"}`}>
                  <div className="font-medium text-gray-900 text-sm">{n.title || "Notification"}</div>
                  <div className="text-sm text-gray-600 mt-1">{n.message || n.content}</div>
                  {n.timestamp && <div className="text-xs text-gray-400 mt-2">{new Date(n.timestamp).toLocaleString()}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryProfile;
