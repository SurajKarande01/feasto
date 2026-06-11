import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../services/api/apiClient";
import { getRestaurantById } from "../../services/api/restaurantService";

const CustomerRestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("name_asc");

  const [cart, setCart] = useState({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");

  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    const fetchMenu = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const [menuRes, infoRes] = await Promise.all([
          apiClient.get(`/restaurants/${id}/menu`),
          getRestaurantById(id)
        ]);
        setMenu(Array.isArray(menuRes.data) ? menuRes.data : []);
        setRestaurantInfo(infoRes);
      } catch (err) {
        setError(err.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("customerProfile");
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile?.userId) setUserId(profile.userId);
        if (profile?.address) setAddress((prev) => ({ ...prev, ...profile.address }));
      }
    } catch {
      // ignore localStorage parse errors
    }
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    menu.forEach((m) => m?.category && set.add(m.category));
    return ["", ...Array.from(set).sort()];
  }, [menu]);

  const filtered = useMemo(() => {
    let list = [...menu];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((m) =>
        (m.name || "").toLowerCase().includes(s) ||
        (m.description || "").toLowerCase().includes(s) ||
        (m.category || "").toLowerCase().includes(s)
      );
    }
    if (category) list = list.filter((m) => m.category === category);
    if (availability) {
      const want = availability === "available";
      list = list.filter((m) => !!m.isAvailable === want);
    }
    switch (sort) {
      case "price_asc":
        list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "name_desc":
        list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      default:
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return list;
  }, [menu, search, category, availability, sort]);

  const cartArray = useMemo(() => Object.values(cart), [cart]);
  const subtotal = useMemo(
    () => cartArray.reduce((sum, ci) => sum + (ci.item.price || 0) * ci.quantity, 0),
    [cartArray]
  );
  const delivery = useMemo(() => (subtotal > 0 ? 30 : 0), [subtotal]);
  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    const code = appliedPromo.toUpperCase();
    if (code === "WELCOME10" || code === "FEASTO10") {
      return Number((subtotal * 0.10).toFixed(2));
    }
    if (code === "GOLD20") {
      return Number((subtotal * 0.20).toFixed(2));
    }
    return 0;
  }, [subtotal, appliedPromo]);

  const total = useMemo(() => {
    const val = subtotal + delivery + Number(tipAmount) - discount;
    return val > 0 ? val : 0;
  }, [subtotal, delivery, tipAmount, discount]);

  const inc = (item) => {
    setCart((prev) => {
      const existing = prev[item.menuItemId];
      const quantity = (existing?.quantity || 0) + 1;
      return { ...prev, [item.menuItemId]: { item, quantity } };
    });
  };
  const dec = (item) => {
    setCart((prev) => {
      const existing = prev[item.menuItemId];
      if (!existing) return prev;
      const quantity = existing.quantity - 1;
      if (quantity <= 0) {
        const { [item.menuItemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.menuItemId]: { item, quantity } };
    });
  };

  const clearCart = () => {
    setCart({});
    setPromoCode("");
    setAppliedPromo("");
    setPromoSuccess("");
    setPromoError("");
    setTipAmount(0);
    setCustomTip("");
  };

  const placeOrder = async () => {
    if (!cartArray.length) {
      window.alert("Add items to cart");
      return;
    }
    if (!userId) {
      window.alert("User not found. Please login as customer.");
      return;
    }
    const payload = {
      userId: Number(userId),
      restaurantId: Number(id),
      orderStatus: "PLACED",
      totalAmount: Number(total.toFixed(2)),
      discountAmount: Number(discount.toFixed(2)),
      promoCode: appliedPromo || null,
      tipAmount: Number(tipAmount),
      deliveryAddress: address,
      orderTime: new Date().toISOString().slice(0, 19),
      orderItems: cartArray.map((ci) => ({
        menuItemId: ci.item.menuItemId,
        quantity: ci.quantity,
        price: ci.item.price,
      })),
    };
    try {
      const res = await apiClient.post("/orders", payload);
      toast.success("Order placed successfully!");
      setCart({});
      setPromoCode("");
      setAppliedPromo("");
      setPromoSuccess("");
      setPromoError("");
      setTipAmount(0);
      setCustomTip("");
      setShowOrderModal(false);
      navigate(`/order-tracking/${res.data.orderId}`);
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || "Failed to place order");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Customer view</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Restaurant Menu</h1>
        </div>
        <Link to="/" className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-sm">
          ← Back
        </Link>
      </div>

      {restaurantInfo && (
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {restaurantInfo.imageUrl && (
              <div className="md:col-span-1 overflow-hidden rounded-2xl h-40">
                <img
                  src={restaurantInfo.imageUrl}
                  alt={restaurantInfo.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={`${restaurantInfo.imageUrl ? "md:col-span-3" : "md:col-span-4"} space-y-3`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {restaurantInfo.cuisineType || "Cuisine"}
                </span>
                <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                  ⭐ {typeof restaurantInfo.rating === 'number' ? restaurantInfo.rating.toFixed(1) : "—"}
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{restaurantInfo.name}</h2>
              {restaurantInfo.description && (
                <p className="text-slate-500 text-sm leading-relaxed">{restaurantInfo.description}</p>
              )}
              {restaurantInfo.address && (
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Location:</span>
                  <span>
                    {restaurantInfo.address.street ? `${restaurantInfo.address.street}, ` : ""}
                    {restaurantInfo.address.city || ""}
                    {restaurantInfo.address.state ? `, ${restaurantInfo.address.state}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner"
              />
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm cursor-pointer md:col-span-2"
              >
                {categories.map((c, i) => (
                  <option key={`${c}-${i}`} value={c}>{c ? c : "All Categories"}</option>
                ))}
              </select>
              <select 
                value={availability} 
                onChange={(e) => setAvailability(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm cursor-pointer"
              >
                <option value="">All Items</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm cursor-pointer"
              >
                <option value="name_asc">Sort: A-Z</option>
                <option value="name_desc">Sort: Z-A</option>
                <option value="price_asc">Price: Low-High</option>
                <option value="price_desc">Price: High-Low</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-3xl border border-slate-100">
              <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading Menu…</span>
            </div>
          )}
          {error && <div className="text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl py-4 font-semibold text-sm">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-28">
              {filtered.map((m) => {
                const inCartQty = cart[m.menuItemId]?.quantity || 0;
                return (
                  <div key={m.menuItemId} className="bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between">
                    <div>
                      {m.imageUrl ? (
                        <img 
                          src={m.imageUrl} 
                          alt={m.name} 
                          className="w-full h-44 object-cover border-b border-slate-50" 
                          loading="lazy" 
                          onError={(e)=>{e.currentTarget.style.display='none'}} 
                        />
                      ) : null}
                      <div className="p-5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">{m.category}</span>
                            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{m.name}</h3>
                          </div>
                          <div className="text-base font-black text-slate-900 shrink-0">₹{m.price}</div>
                        </div>
                        {m.description && <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{m.description}</p>}
                        <div className="pt-1">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                            m.isAvailable ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}>
                            {m.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="flex items-center gap-2 border-t border-slate-50 pt-4">
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={inCartQty===0} 
                            onClick={() => dec(m)} 
                            className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-600 transition-all ${
                              inCartQty===0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            -
                          </button>
                          <div className="min-w-8 text-center text-sm font-bold text-slate-800">{inCartQty}</div>
                          <button 
                            onClick={() => inc(m)} 
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => inc(m)} 
                          disabled={!m.isAvailable} 
                          className={`ml-auto px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md ${
                            m.isAvailable 
                              ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 cursor-pointer active:scale-98' 
                              : 'bg-slate-300 cursor-not-allowed shadow-none'
                          }`}
                        >
                          Add to Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!filtered.length && (
                <div className="col-span-full text-center text-slate-500 py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="text-3xl mb-2">🍽️</div>
                  <h3 className="text-base font-bold text-slate-700">No dishes available</h3>
                  <p className="text-slate-400 text-xs mt-1">Try selecting another category or searching differently.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {cartArray.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 bg-slate-950/95 backdrop-blur-md text-white rounded-2xl py-4 px-6 shadow-2xl z-40 max-w-5xl mx-auto flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
            <span className="bg-rose-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-extrabold flex items-center justify-center shadow-md shadow-rose-500/35">
              {cartArray.reduce((acc, ci) => acc + ci.quantity, 0)}
            </span>
            <div className="text-xs">
              <p className="text-slate-400 font-medium">Cart total</p>
              <p className="text-sm font-black text-white">₹{total.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={clearCart} 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Clear Cart
            </button>
            <button 
              onClick={() => setShowOrderModal(true)} 
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/20 cursor-pointer"
            >
              Proceed to Order
            </button>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowOrderModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[32px] border border-slate-100 shadow-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Checkout</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Order</h2>
              </div>
              <button 
                onClick={() => setShowOrderModal(false)} 
                className="p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[25vh] overflow-y-auto pr-1">
              {cartArray.map((ci) => (
                <div key={ci.item.menuItemId} className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3">
                  <div>
                    <div className="font-extrabold text-sm text-slate-800">{ci.item.name}</div>
                    <div className="text-xs text-slate-400 font-semibold mt-0.5">Qty {ci.quantity} × ₹{ci.item.price}</div>
                  </div>
                  <div className="text-sm font-black text-slate-900">₹{(ci.item.price * ci.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Promo Code Discount */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">Promo Code</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code (e.g. WELCOME10, GOLD20)"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError("");
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = promoCode.trim().toUpperCase();
                    if (code === "WELCOME10" || code === "FEASTO10" || code === "GOLD20") {
                      setAppliedPromo(code);
                      setPromoSuccess(`Promo code ${code} applied successfully!`);
                      setPromoError("");
                    } else if (!code) {
                      setAppliedPromo("");
                      setPromoSuccess("");
                      setPromoError("");
                    } else {
                      setAppliedPromo("");
                      setPromoSuccess("");
                      setPromoError("Invalid promo code. Try WELCOME10 or GOLD20.");
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-[10px] text-rose-500 font-semibold mt-1">{promoError}</p>}
              {promoSuccess && <p className="text-[10px] text-emerald-600 font-semibold mt-1">{promoSuccess}</p>}
            </div>

            {/* Driver Tip Selection */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">Driver Tip</div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[0, 10, 20, 50].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTipAmount(t);
                      setCustomTip("");
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      tipAmount === t && !customTip
                        ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/10"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t === 0 ? "No Tip" : `₹${t}`}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Custom Tip Amount"
                value={customTip}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomTip(val);
                  if (!val) {
                    setTipAmount(0);
                  } else {
                    const num = Number(val);
                    if (num >= 0) {
                      setTipAmount(num);
                    }
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
              />
            </div>

            <div className="mt-6 space-y-2.5 text-xs border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between text-slate-500 font-medium"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Discount ({appliedPromo})</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-500 font-medium"><span>Delivery Charge</span><span>₹{delivery.toFixed(2)}</span></div>
              {tipAmount > 0 && (
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Driver Tip</span>
                  <span>₹{Number(tipAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-100"><span>Grand Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>

            <div className="mt-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Delivery Address</div>
              <div className="space-y-3">
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" 
                  placeholder="Street Address" 
                  value={address.street} 
                  onChange={(e)=>setAddress(a=>({...a,street:e.target.value}))} 
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" 
                    placeholder="City" 
                    value={address.city} 
                    onChange={(e)=>setAddress(a=>({...a,city:e.target.value}))} 
                  />
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" 
                    placeholder="State" 
                    value={address.state} 
                    onChange={(e)=>setAddress(a=>({...a,state:e.target.value}))} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" 
                    placeholder="Postal Code" 
                    value={address.postalCode} 
                    onChange={(e)=>setAddress(a=>({...a,postalCode:e.target.value}))} 
                  />
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" 
                    placeholder="Country" 
                    value={address.country} 
                    onChange={(e)=>setAddress(a=>({...a,country:e.target.value}))} 
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button 
                onClick={clearCart} 
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Clear Cart
              </button>
              <div className="flex gap-2.5">
                <button 
                  onClick={() => setShowOrderModal(false)} 
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={placeOrder} 
                  disabled={!cartArray.length} 
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md ${
                    cartArray.length 
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 cursor-pointer active:scale-98' 
                      : 'bg-slate-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRestaurantDetail;
