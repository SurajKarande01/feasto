import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const CustomerRestaurantDetail = () => {
  const { id } = useParams();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("name_asc");

  const [cart, setCart] = useState({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [userId, setUserId] = useState(null);

  const [address, setAddress] = useState({
    street: "123 MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
    latitude: 19.076,
    longitude: 72.8777,
  });

  useEffect(() => {
    const fetchMenu = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:8080/api/restaurants/${id}/menu`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        setMenu(Array.isArray(data) ? data : []);
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
  const discount = useMemo(() => 0, []);
  const total = useMemo(() => subtotal + delivery - discount, [subtotal, delivery, discount]);

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

  const clearCart = () => setCart({});

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
      deliveryAddress: address,
      orderTime: new Date().toISOString().slice(0, 19),
      orderItems: cartArray.map((ci) => ({
        menuItemId: ci.item.menuItemId,
        quantity: ci.quantity,
        price: ci.item.price,
      })),
    };
    try {
      const res = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Order failed ${res.status}`);
      const data = await res.json().catch(() => ({}));
      window.alert("Order placed successfully");
      setCart({});
      setShowOrderModal(false);
      return data;
    } catch (e) {
      window.alert(e.message || "Failed to place order");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between py-4">
        <div className="text-2xl font-semibold">Restaurant Menu</div>
        <Link to="/" className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">Back</Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-4">
          <div className="bg-white/90 rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu"
                className="w-full p-2 rounded border"
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 rounded border md:col-span-2">
                {categories.map((c, i) => (
                  <option key={`${c}-${i}`} value={c}>{c ? c : "All Categories"}</option>
                ))}
              </select>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full p-2 rounded border">
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full p-2 rounded border">
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="price_asc">Price Low-High</option>
                <option value="price_desc">Price High-Low</option>
              </select>
            </div>
          </div>

          {loading && <div className="text-center py-10">Loading menu…</div>}
          {error && <div className="text-center text-red-600 py-4">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-24">
              {filtered.map((m) => {
                const inCartQty = cart[m.menuItemId]?.quantity || 0;
                return (
                  <div key={m.menuItemId} className="bg-white rounded-lg shadow overflow-hidden">
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt={m.name} className="w-full h-48 object-cover" loading="lazy" onError={(e)=>{e.currentTarget.style.display='none'}} />
                    ) : null}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-lg font-semibold">{m.name}</div>
                          <div className="text-xs text-gray-600">{m.category}</div>
                        </div>
                        <div className="text-base font-medium">₹{m.price}</div>
                      </div>
                      {m.description && <div className="text-sm text-gray-700 line-clamp-2">{m.description}</div>}
                      <div className={`text-xs ${m.isAvailable ? 'text-green-700' : 'text-red-700'}`}>{m.isAvailable ? 'Available' : 'Unavailable'}</div>
                      <div className="flex items-center gap-2 pt-2">
                        <button disabled={inCartQty===0} onClick={() => dec(m)} className={`px-3 py-1 rounded border ${inCartQty===0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}>-</button>
                        <div className="min-w-8 text-center">{inCartQty}</div>
                        <button onClick={() => inc(m)} className="px-3 py-1 rounded border hover:bg-gray-50">+</button>
                        <button onClick={() => inc(m)} disabled={!m.isAvailable} className={`ml-auto px-4 py-1.5 rounded text-white ${m.isAvailable ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                          Add to Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!filtered.length && (
                <div className="col-span-full text-center text-gray-600 py-10">No menu items match your filters</div>
              )}
            </div>
          )}
        </div>
      </div>

      {cartArray.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{cartArray.length} item(s)</span>
              <span className="mx-2">•</span>
              <span>Total ₹{total.toFixed(2)}</span>
            </div>
            <button onClick={() => setShowOrderModal(true)} className="ml-auto px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700">
              Proceed to Order
            </button>
            <button onClick={clearCart} className="px-3 py-2 rounded border hover:bg-gray-50">Clear Cart</button>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowOrderModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-lg shadow-lg p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Your Order</div>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-600 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-2">
              {cartArray.map((ci) => (
                <div key={ci.item.menuItemId} className="flex items-start justify-between gap-2 border-b pb-2">
                  <div>
                    <div className="font-medium text-sm">{ci.item.name}</div>
                    <div className="text-xs text-gray-600">Qty {ci.quantity} × ₹{ci.item.price}</div>
                  </div>
                  <div className="text-sm font-medium">₹{(ci.item.price * ci.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Delivery</span><span>₹{delivery.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-base font-semibold pt-2 border-t"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Delivery Address</div>
              <div className="grid grid-cols-1 gap-2">
                <input className="p-2 rounded border" placeholder="Street" value={address.street} onChange={(e)=>setAddress(a=>({...a,street:e.target.value}))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="p-2 rounded border" placeholder="City" value={address.city} onChange={(e)=>setAddress(a=>({...a,city:e.target.value}))} />
                  <input className="p-2 rounded border" placeholder="State" value={address.state} onChange={(e)=>setAddress(a=>({...a,state:e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="p-2 rounded border" placeholder="Postal Code" value={address.postalCode} onChange={(e)=>setAddress(a=>({...a,postalCode:e.target.value}))} />
                  <input className="p-2 rounded border" placeholder="Country" value={address.country} onChange={(e)=>setAddress(a=>({...a,country:e.target.value}))} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={placeOrder} disabled={!cartArray.length} className={`px-4 py-2 rounded text-white ${cartArray.length ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                Place Order
              </button>
              <button onClick={() => setShowOrderModal(false)} className="px-4 py-2 rounded border hover:bg-gray-50">Cancel</button>
              <button onClick={clearCart} className="ml-auto px-3 py-2 rounded border hover:bg-gray-50">Clear Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRestaurantDetail;

