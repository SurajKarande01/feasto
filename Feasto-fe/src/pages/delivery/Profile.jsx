import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDeliveryPartnerById, getDeliveryNotifications, markAllDeliveryNotificationsRead, getDeliveryPartnerReviews } from "../../services/api/deliveryService";
import { toast } from "react-toastify";
import { Star, Edit3, MapPin, Loader2, Save, X, Trash2 } from "lucide-react";
import apiClient from "../../services/api/apiClient";

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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = useCallback(async () => {
    const id = getPartnerId();
    if (!id) { setLoading(false); return; }
    setLoading(true);
    try {
      const raw = localStorage.getItem("deliveryProfile");
      if (raw) setProfile(JSON.parse(raw));
      try { const apiProfile = await getDeliveryPartnerById(id); setProfile(apiProfile); } catch { /* use localStorage */ }
      try { const notifs = await getDeliveryNotifications(id); setNotifications(Array.isArray(notifs) ? notifs : []); } catch { /* no notifs */ }
      try { const revs = await getDeliveryPartnerReviews(id); setReviews(Array.isArray(revs) ? revs : []); } catch { /* no reviews */ }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMarkAllRead = async () => {
    const id = getPartnerId();
    if (!id) return;
    try { 
      await markAllDeliveryNotificationsRead(id); 
      setNotifications(n => n.map(x => ({ ...x, isRead: true }))); 
      toast.success("Notifications marked as read"); 
    } catch { 
      toast.error("Failed to mark notifications"); 
    }
  };

  const handleLogout = () => { 
    localStorage.clear(); 
    navigate("/welcome"); 
  };

  const handleEditClick = () => {
    setEditForm({
      name: profile.name || "",
      phoneNumber: profile.phoneNumber || "",
      vehicleType: profile.vehicleType || "Bicycle",
      vehicleDetails: profile.vehicleDetails || "",
      latitude: profile.currentLocation?.latitude || "",
      longitude: profile.currentLocation?.longitude || "",
      available: profile.available ?? profile.isAvailable ?? false,
      password: ""
    });
    setIsEditing(true);
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setEditForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
        () => toast.error("Location access denied or unavailable.")
      );
    } else {
      toast.error("Geolocation not supported by this browser.");
    }
  };

  const handleUpdateProfile = async () => {
    const id = getPartnerId();
    if (!id) return;
    setIsUpdating(true);
    try {
      const payload = {
        name: editForm.name,
        phoneNumber: editForm.phoneNumber,
        vehicleType: editForm.vehicleType,
        vehicleDetails: editForm.vehicleDetails,
        available: editForm.available,
        currentLocation: (editForm.latitude && editForm.longitude) ? { latitude: parseFloat(editForm.latitude), longitude: parseFloat(editForm.longitude) } : null
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      const { data } = await apiClient.put(`/delivery-partners/${id}`, payload);
      setProfile(data);
      localStorage.setItem("deliveryProfile", JSON.stringify(data));
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your delivery profile? This action cannot be undone.")) return;
    const id = getPartnerId();
    if (!id) return;
    setIsUpdating(true);
    try {
      await apiClient.delete(`/delivery-partners/${id}`);
      localStorage.clear();
      toast.success("Profile deleted successfully!");
      navigate("/welcome");
    } catch (err) {
      toast.error("Failed to delete profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading rider profile…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-white">
        <div className="text-slate-400 text-3xl mb-2">🔒</div>
        <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
        <p className="text-slate-400 text-xs mt-1">Please sign in as a delivery partner to view this profile dashboard.</p>
        <button onClick={() => navigate("/welcome")} className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer">Go to Login</button>
      </div>
    );
  }

  const loc = profile.currentLocation || {};
  const hasNotifications = notifications.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-16">
      
      {/* Header Profile Hero Card */}
      <div className="bg-slate-50 border border-slate-100 p-6 rounded-[32px] mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-rose-500/20 shrink-0">
            {(profile.name || "R").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{profile.name || "Delivery Partner"}</h1>
            <p className="text-slate-500 text-xs mt-1.5 font-semibold">{profile.email}</p>
            {profile.phoneNumber && <p className="text-slate-400 text-[11px] font-bold mt-0.5">{profile.phoneNumber}</p>}
          </div>
          <div className="flex gap-2 items-center self-start sm:self-center shrink-0">
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${
              profile.isAvailable || profile.available 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              {profile.isAvailable || profile.available ? "Online" : "Offline"}
            </span>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-all hover:bg-rose-100 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => setActiveTab("profile")} 
          className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
            activeTab === "profile" 
              ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          My Profile
        </button>
        <button 
          onClick={() => setActiveTab("notifications")} 
          className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
            activeTab === "notifications" 
              ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          Notifications {notifications.length > 0 && `(${notifications.length})`}
        </button>
        <button 
          onClick={() => setActiveTab("reviews")} 
          className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
            activeTab === "reviews" 
              ? "bg-slate-950 text-white border-slate-950 shadow-sm" 
              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          Reviews
        </button>
      </div>

      {activeTab === "profile" && !isEditing && (
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] relative">
          <button onClick={handleEditClick} className="absolute top-6 right-6 p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer" title="Edit Profile">
            <Edit3 size={18}/>
          </button>
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Full Name</span>
              <div className="font-bold text-slate-800 text-sm">{profile.name || "—"}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Email Address</span>
              <div className="font-bold text-slate-800 text-sm">{profile.email || "—"}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Phone Number</span>
              <div className="font-bold text-slate-800 text-sm">{profile.phoneNumber || "—"}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Vehicle Details</span>
              <div className="font-bold text-slate-800 text-sm">{profile.vehicleDetails || profile.vehicleType || "—"}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Partner Identifier</span>
              <div className="font-bold text-slate-800 text-sm">{profile.id || profile.deliveryPartnerId || "—"}</div>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Current Status</span>
              <div className="font-bold text-slate-800 text-sm">{profile.isAvailable || profile.available ? "Active & Online" : "Inactive / Offline"}</div>
            </div>
          </div>

          {(loc.latitude || loc.longitude) && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Last Known Geolocation</span>
              <p className="text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl inline-block border border-slate-100">
                Latitude: {loc.latitude} • Longitude: {loc.longitude}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "profile" && isEditing && (
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] animate-fade-in-up">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Edit Profile</h2>
             <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer" title="Cancel">
               <X size={18}/>
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm" placeholder="Your Name"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
              <input value={editForm.phoneNumber} onChange={e => setEditForm(p => ({...p, phoneNumber: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm" placeholder="Phone Number"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</label>
              <select value={editForm.vehicleType} onChange={e => setEditForm(p => ({...p, vehicleType: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm cursor-pointer">
                 <option>Bicycle</option><option>Motorcycle</option><option>Car</option><option>Scooter</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Details</label>
              <input value={editForm.vehicleDetails} onChange={e => setEditForm(p => ({...p, vehicleDetails: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm" placeholder="e.g. Red Honda Activa"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <select value={editForm.available ? "true" : "false"} onChange={e => setEditForm(p => ({...p, available: e.target.value === "true"}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm cursor-pointer">
                 <option value="true">Online</option>
                 <option value="false">Offline</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password (leave blank to keep current)</label>
              <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({...p, password: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm" placeholder="••••••••"/>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
             <div className="flex justify-between items-center mb-4">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geolocation</label>
                 <button onClick={handleDetectLocation} type="button" className="text-[10px] font-bold flex items-center gap-1 bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg border border-sky-100 hover:bg-sky-100 transition-colors cursor-pointer">
                    <MapPin size={12}/> Detect My Location
                 </button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Latitude</label>
                   <input value={editForm.latitude} onChange={e => setEditForm(p => ({...p, latitude: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm" placeholder="e.g. 19.0760"/>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Longitude</label>
                   <input value={editForm.longitude} onChange={e => setEditForm(p => ({...p, longitude: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 shadow-sm" placeholder="e.g. 72.8777"/>
                 </div>
             </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
             <button onClick={handleDeleteProfile} disabled={isUpdating} className="px-5 py-2.5 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
                <Trash2 size={14}/> Delete Account
             </button>
             <div className="flex gap-3">
                 <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
                 <button onClick={handleUpdateProfile} disabled={isUpdating} className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                    {isUpdating ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} {isUpdating ? 'Saving...' : 'Save Changes'}
                 </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-5">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Notifications</h2>
            {hasNotifications && (
              <button 
                onClick={handleMarkAllRead} 
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {!hasNotifications ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">All caught up!</p>
              <p className="text-slate-400 text-[10px] mt-0.5">No notifications at the moment.</p>
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
                  <div className="font-extrabold text-slate-900 text-xs">{n.title || "Notification"}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message || n.content}</div>
                  {n.timestamp && (
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">
                      {new Date(n.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">
                      <Star className="mx-auto mb-3 opacity-20" size={40}/>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No reviews yet</p>
                      <p className="text-[10px] mt-1">Complete deliveries to earn your first rating!</p>
                  </div>
              ) : (
                  reviews.map(review => (
                      <div key={review.reviewId} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <div className="flex gap-1 mb-1">
                                      {[1,2,3,4,5].map(s => (
                                          <Star key={s} size={14} className={s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-300"} />
                                      ))}
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                      {review.reviewTime ? new Date(review.reviewTime).toLocaleDateString() : 'Recent'}
                                  </div>
                              </div>
                              {review.orderId && (
                                <div className="text-[9px] bg-white text-slate-500 font-bold px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                    Order #{review.orderId}
                                </div>
                              )}
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                              "{review.comment || 'No comment provided'}"
                          </p>
                      </div>
                  ))
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryProfile;
