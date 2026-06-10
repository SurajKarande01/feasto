import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getUserById, getLoyaltyByUserId, subscribeLoyalty, getCustomerNotifications, markAllCustomerNotificationsRead } from "../../services/api/customerService";
import Footer from "../../components/common/Footer";

const getUserIdFromStorage = () => {
  try {
    const raw = localStorage.getItem("customerProfile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.userId || p?.id || null;
  } catch { return null; }
};

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const loadData = useCallback(async () => {
    const userId = getUserIdFromStorage();
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Load profile from localStorage first (always available), then try API
      const raw = localStorage.getItem("customerProfile");
      if (raw) setProfile(JSON.parse(raw));
      try { const apiProfile = await getUserById(userId); setProfile(apiProfile); } catch { /* use localStorage fallback */ }
      try { const loyaltyData = await getLoyaltyByUserId(userId); setLoyalty(loyaltyData); } catch { /* no loyalty */ }
      try { const notifs = await getCustomerNotifications(userId); setNotifications(Array.isArray(notifs) ? notifs : []); } catch { /* no notifications */ }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubscribeLoyalty = async (membershipType) => {
    const userId = getUserIdFromStorage();
    if (!userId) return;
    setLoyaltyLoading(true);
    try {
      const data = await subscribeLoyalty({ userId, membershipType, points: 0 });
      setLoyalty(data);
      toast.success(`Subscribed to ${membershipType} membership!`);
    } catch (err) { toast.error(err?.response?.data?.error || "Failed to subscribe"); }
    finally { setLoyaltyLoading(false); }
  };

  const handleMarkAllRead = async () => {
    const userId = getUserIdFromStorage();
    if (!userId) return;
    try { await markAllCustomerNotificationsRead(userId); setNotifications(n => n.map(x => ({ ...x, isRead: true }))); toast.success("All notifications marked as read"); }
    catch { toast.error("Failed to mark notifications"); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/welcome");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading profile…</div></div>;
  if (!profile) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Please login to view your profile</div></div>;

  const addr = profile.address || {};

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {(profile.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name || "Customer"}</h1>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              {profile.phoneNumber && <p className="text-gray-500 text-sm">{profile.phoneNumber}</p>}
            </div>
            <div className="flex gap-2">
              {loyalty && <span className={`px-3 py-1 rounded-full text-xs font-bold ${loyalty.membershipType === "GOLD" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : "bg-gray-100 text-gray-700 border border-gray-200"}`}>{loyalty.membershipType} Member</span>}
              <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-200 hover:bg-red-100">Logout</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {["profile", "loyalty", "notifications"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize ${activeTab === tab ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{tab}</button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-500">Full Name</label><div className="font-medium text-gray-900 mt-1">{profile.name || "—"}</div></div>
              <div><label className="text-sm text-gray-500">Email</label><div className="font-medium text-gray-900 mt-1">{profile.email || "—"}</div></div>
              <div><label className="text-sm text-gray-500">Phone</label><div className="font-medium text-gray-900 mt-1">{profile.phoneNumber || "—"}</div></div>
              <div><label className="text-sm text-gray-500">User ID</label><div className="font-medium text-gray-900 mt-1">{profile.userId || profile.id || "—"}</div></div>
            </div>
            <h3 className="text-md font-bold text-gray-900 mt-6 mb-3">Delivery Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-500">Street</label><div className="font-medium text-gray-900 mt-1">{addr.street || "—"}</div></div>
              <div><label className="text-sm text-gray-500">City</label><div className="font-medium text-gray-900 mt-1">{addr.city || "—"}</div></div>
              <div><label className="text-sm text-gray-500">State</label><div className="font-medium text-gray-900 mt-1">{addr.state || "—"}</div></div>
              <div><label className="text-sm text-gray-500">Postal Code</label><div className="font-medium text-gray-900 mt-1">{addr.postalCode || "—"}</div></div>
              <div><label className="text-sm text-gray-500">Country</label><div className="font-medium text-gray-900 mt-1">{addr.country || "—"}</div></div>
            </div>
          </div>
        )}

        {/* Loyalty Tab */}
        {activeTab === "loyalty" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Loyalty Program</h2>
            {loyalty ? (
              <div>
                <div className={`p-6 rounded-xl border-2 mb-4 ${loyalty.membershipType === "GOLD" ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">{loyalty.membershipType === "GOLD" ? "🏆" : "⭐"} {loyalty.membershipType}</span>
                    <span className="text-sm text-gray-500">Points: <span className="font-bold text-gray-900">{loyalty.points || 0}</span></span>
                  </div>
                  <p className="text-sm text-gray-600">{loyalty.membershipType === "GOLD" ? "Free delivery on select restaurants & up to 30% off!" : "Earn points on every order. Upgrade to Gold for extra perks!"}</p>
                  {loyalty.expiryDate && <p className="text-xs text-gray-400 mt-2">Valid until: {new Date(loyalty.expiryDate).toLocaleDateString()}</p>}
                </div>
                {loyalty.membershipType === "BASIC" && (
                  <button onClick={() => handleSubscribeLoyalty("GOLD")} disabled={loyaltyLoading} className="px-6 py-2.5 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 disabled:opacity-50">
                    {loyaltyLoading ? "Upgrading..." : "Upgrade to Gold ✨"}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🎁</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Join Feasto Rewards</h3>
                <p className="text-gray-500 text-sm mb-4">Earn points on every order and unlock exclusive perks!</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => handleSubscribeLoyalty("BASIC")} disabled={loyaltyLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">Join Basic (Free)</button>
                  <button onClick={() => handleSubscribeLoyalty("GOLD")} disabled={loyaltyLoading} className="px-6 py-2.5 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 disabled:opacity-50">Join Gold ✨</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              {notifications.length > 0 && <button onClick={handleMarkAllRead} className="text-sm text-blue-600 hover:underline">Mark all as read</button>}
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-10"><div className="text-5xl mb-3">🔔</div><p className="text-gray-500">No notifications yet</p></div>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.notificationId || n.id} className={`p-4 rounded-xl border ${n.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-200"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{n.title || "Notification"}</div>
                        <div className="text-sm text-gray-600 mt-1">{n.message || n.content}</div>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                    </div>
                    {n.timestamp && <div className="text-xs text-gray-400 mt-2">{new Date(n.timestamp).toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CustomerProfile;
