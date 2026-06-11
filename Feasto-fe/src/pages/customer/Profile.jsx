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
      const raw = localStorage.getItem("customerProfile");
      if (raw) setProfile(JSON.parse(raw));
      try { const apiProfile = await getUserById(userId); setProfile(apiProfile); } catch { /* fallback */ }
      try { const loyaltyData = await getLoyaltyByUserId(userId); setLoyalty(loyaltyData); } catch { /* no loyalty */ }
      try { const notifs = await getCustomerNotifications(userId); setNotifications(Array.isArray(notifs) ? notifs : []); } catch { /* no notifs */ }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading Profile…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="text-4xl mb-3">🔑</div>
        <p className="text-slate-500 font-semibold text-sm mb-4">Please login to view your profile</p>
        <button onClick={() => navigate("/become-customer")} className="px-6 py-2.5 bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20">Sign In</button>
      </div>
    );
  }

  const addr = profile.address || {};

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Profile Header Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-rose-500/20 shrink-0">
              {(profile.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Welcome back</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">{profile.name || "Customer"}</h1>
              <p className="text-slate-500 text-xs truncate mt-0.5">{profile.email}</p>
              {profile.phoneNumber && <p className="text-slate-400 text-[11px] font-medium mt-1">📞 {profile.phoneNumber}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
              {loyalty && (
                <span className={`px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${
                  loyalty.membershipType === "GOLD" 
                    ? "bg-amber-50 text-amber-700 border-amber-200/50" 
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}>
                  {loyalty.membershipType} Tier
                </span>
              )}
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200/40 transition-all cursor-pointer shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100">
          {["profile", "loyalty", "notifications"].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 capitalize border cursor-pointer mb-2 ${
                activeTab === tab 
                  ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200/60 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <div className="font-bold text-slate-800 text-sm">{profile.name || "—"}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="font-bold text-slate-800 text-sm">{profile.email || "—"}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                  <div className="font-bold text-slate-800 text-sm">{profile.phoneNumber || "—"}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">User Identifier</label>
                  <div className="font-bold text-slate-800 text-sm">{profile.userId || profile.id || "—"}</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <h3 className="text-base font-black text-slate-900 tracking-tight mb-4">Default Delivery Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Street</label>
                  <div className="font-bold text-slate-800 text-sm">{addr.street || "—"}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">City</label>
                  <div className="font-bold text-slate-800 text-sm">{addr.city || "—"}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State</label>
                  <div className="font-bold text-slate-800 text-sm">{addr.state || "—"}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Postal Code</label>
                  <div className="font-bold text-slate-800 text-sm">{addr.postalCode || "—"}</div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Country</label>
                  <div className="font-bold text-slate-800 text-sm">{addr.country || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loyalty Tab */}
        {activeTab === "loyalty" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-5">Feasto Rewards Program</h2>
            {loyalty ? (
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border-2 mb-4 relative overflow-hidden ${
                  loyalty.membershipType === "GOLD" 
                    ? "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/40 shadow-sm" 
                    : "border-slate-100 bg-slate-50/50"
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-amber-900 flex items-center gap-1.5">
                      {loyalty.membershipType === "GOLD" ? "🏆 Gold Tier" : "⭐ Basic Tier"}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-white/60 px-3 py-1 rounded-full border border-slate-200/40">
                      Points: <span className="font-extrabold text-slate-900">{loyalty.points || 0}</span>
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-md">
                    {loyalty.membershipType === "GOLD" 
                      ? "Congratulations! You unlock free delivery on select premium restaurants and up to 30% discount on all Feasto Gold orders." 
                      : "Earn loyalty points on every order placed. Upgrade to Gold membership to access ultimate dining rewards and zero delivery fees."
                    }
                  </p>
                  {loyalty.expiryDate && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">
                      Expires: {new Date(loyalty.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {loyalty.membershipType === "BASIC" && (
                  <button 
                    onClick={() => handleSubscribeLoyalty("GOLD")} 
                    disabled={loyaltyLoading} 
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {loyaltyLoading ? "Upgrading..." : "Upgrade to Gold ✨"}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎁</div>
                <h3 className="text-base font-bold text-slate-700 mb-2">Join Feasto Rewards</h3>
                <p className="text-slate-400 text-xs max-w-xs mx-auto mb-6">Earn points on every online order and unlock premium perks, free deliveries, and meal discounts!</p>
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => handleSubscribeLoyalty("BASIC")} 
                    disabled={loyaltyLoading} 
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Join Basic (Free)
                  </button>
                  <button 
                    onClick={() => handleSubscribeLoyalty("GOLD")} 
                    disabled={loyaltyLoading} 
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    Join Gold ✨
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h2>
              {notifications.length > 0 && (
                <button 
                  onClick={handleMarkAllRead} 
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔔</div>
                <p className="text-slate-400 text-xs font-semibold">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(n => (
                  <div 
                    key={n.notificationId || n.id} 
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      n.isRead 
                        ? "bg-white border-slate-100" 
                        : "bg-rose-50/20 border-rose-100/50 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-slate-800">{n.title || "Notification"}</div>
                        <div className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message || n.content}</div>
                      </div>
                      {!n.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1.5 shadow-sm shadow-rose-500/30" />
                      )}
                    </div>
                    {n.timestamp && (
                      <div className="text-[10px] font-semibold text-slate-400 mt-3">
                        {new Date(n.timestamp).toLocaleString()}
                      </div>
                    )}
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
