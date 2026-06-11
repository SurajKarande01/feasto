import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getRandomRestaurants, searchRestaurants, getNearbyRestaurants } from "../../services/api/restaurantService";

const CUISINE_CATEGORIES = [
  { name: "Pizza", emoji: "🍕" },
  { name: "Burger", emoji: "🍔" },
  { name: "Biryani", emoji: "🍛" },
  { name: "Chinese", emoji: "🍜" },
  { name: "Desserts", emoji: "🍰" },
  { name: "Beverages", emoji: "🥤" },
  { name: "Healthy", emoji: "🥗" },
  { name: "North Indian", emoji: "🍲" },
  { name: "South Indian", emoji: "🥘" },
];

const FilteredRestaurant = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("name_asc");
  
  const [locationMode, setLocationMode] = useState("detecting"); // "detecting" | "nearby" | "fallback"
  const [coords, setCoords] = useState(null);

  // Get user profile coordinates from localStorage
  const getProfileCoords = () => {
    try {
      const raw = localStorage.getItem("customerProfile");
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (p?.address?.latitude && p?.address?.longitude) {
        return { lat: p.address.latitude, lon: p.address.longitude };
      }
    } catch {
      return null;
    }
    return null;
  };

  // Detect location
  useEffect(() => {
    const profileCoords = getProfileCoords();
    if (profileCoords) {
      setCoords(profileCoords);
      setLocationMode("nearby");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationMode("nearby");
        },
        () => {
          setLocationMode("fallback");
        },
        { timeout: 5000 }
      );
    } else {
      setLocationMode("fallback");
    }
  }, []);

  // Fetch restaurants based on mode and search
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data = [];
      if (search.trim()) {
        const res = await searchRestaurants(search);
        data = res.content || res || [];
      } else if (locationMode === "nearby" && coords) {
        const res = await getNearbyRestaurants({
          mylat: coords.lat,
          mylon: coords.lon,
          maxDistanceKm: 100,
          limit: 20
        });
        data = res.content || res || [];
      } else {
        data = await getRandomRestaurants(20);
      }
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }, [locationMode, coords, search]);

  useEffect(() => {
    if (locationMode !== "detecting") {
      fetchRestaurants();
    }
  }, [locationMode, coords, search, fetchRestaurants]);

  // Derived filter options
  const cuisines = useMemo(() => {
    const set = new Set();
    restaurants.forEach(r => r?.cuisineType && set.add(r.cuisineType));
    return Array.from(set).sort();
  }, [restaurants]);

  const cities = useMemo(() => {
    const set = new Set();
    restaurants.forEach(r => r?.address?.city && set.add(r.address.city));
    return Array.from(set).sort();
  }, [restaurants]);

  // Client-side filtering & sorting of retrieved results
  const filtered = useMemo(() => {
    let list = [...restaurants];
    
    if (cuisine) list = list.filter(r => r.cuisineType === cuisine);
    if (city) list = list.filter(r => r.address?.city === city);

    switch (sort) {
      case "name_desc":
        list.sort((a,b) => (b.name||"").localeCompare(a.name||""));
        break;
      case "rating_desc":
        list.sort((a,b) => (b.rating ?? -1) - (a.rating ?? -1));
        break;
      case "distance_asc":
        list.sort((a,b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        break;
      default:
        list.sort((a,b) => (a.name||"").localeCompare(b.name||""));
    }
    return list;
  }, [restaurants, cuisine, city, sort]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* What's on your mind? Cuisine Slider */}
      <div className="mb-8 bg-white/60 backdrop-blur-md rounded-[28px] border border-slate-100 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <h2 className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest mb-4 px-1">What's on your mind?</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
          {CUISINE_CATEGORIES.map((cat) => {
            const isActive = cuisine.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setCuisine(isActive ? "" : cat.name)}
                className={`flex flex-col items-center justify-center min-w-[84px] py-3 px-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20 scale-98"
                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-700 shadow-sm hover:scale-[1.02]"
                }`}
              >
                <span className="text-2xl mb-1 select-none">{cat.emoji}</span>
                <span className="text-[10px] font-extrabold tracking-wide uppercase truncate max-w-[76px]">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100 p-6 mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, cuisine..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner"
            />
          </div>
          
          <select 
            value={cuisine} 
            onChange={(e)=>setCuisine(e.target.value)} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm cursor-pointer"
          >
            <option value="">All Cuisines</option>
            {cuisines.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select 
            value={city} 
            onChange={(e)=>setCity(e.target.value)} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm cursor-pointer"
          >
            <option value="">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select 
            value={sort} 
            onChange={(e)=>setSort(e.target.value)} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm cursor-pointer"
          >
            <option value="name_asc">Sort: Name A-Z</option>
            <option value="name_desc">Sort: Name Z-A</option>
            <option value="rating_desc">Sort: Rating High</option>
            <option value="distance_asc">Sort: Distance Nearest</option>
          </select>
        </div>

        {/* Location status badge */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-1">
          <div>
            {locationMode === "detecting" && <span>📍 Detecting your location...</span>}
            {locationMode === "nearby" && (
              <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-emerald-100">
                📍 Showing nearby restaurants first
              </span>
            )}
            {locationMode === "fallback" && (
              <span className="bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-amber-100">
                🔍 Showing popular restaurants (fallback)
              </span>
            )}
          </div>
          {coords && (
            <span className="text-slate-400 font-medium">GPS: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-3xl border border-slate-100">
          <div className="w-9 h-9 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Fetching restaurants…</span>
        </div>
      )}
      
      {error && <div className="text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl py-4 font-semibold text-sm">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-8 pb-12">
          {filtered.map(r => {
            const addr = r.address || {};
            const rating = r.rating ?? "—";
            const distance = r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km` : "—";
            return (
              <div key={r.restaurantId} className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <div className="md:col-span-1 overflow-hidden flex items-center justify-center p-5">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={`${r.name}`}
                        className="w-full h-48 md:h-36 object-cover rounded-2xl shadow-sm border border-slate-100"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-36 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-semibold border border-dashed border-slate-200">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3 p-6 pl-0 md:pl-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">{r.cuisineType || "Cuisine"}</span>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{r.name}</h3>
                      </div>
                      <div className="text-xs text-slate-600 flex gap-4 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 font-semibold self-start shadow-sm">
                        <span className="flex items-center gap-1">⭐ <span className="text-slate-800">{rating}</span></span>
                        <span className="flex items-center gap-1">📍 <span className="text-slate-800">{distance}</span></span>
                      </div>
                    </div>
                    {r.description && (
                      <p className="mt-3 text-slate-500 text-sm leading-relaxed line-clamp-2">{r.description}</p>
                    )}
                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                      <span className="font-semibold text-slate-600">Address:</span>
                      <span> {addr.street ? `${addr.street}, ` : ""}{addr.city || ""}{addr.state ? `, ${addr.state}` : ""}{addr.postalCode ? `, ${addr.postalCode}` : ""}</span>
                    </div>
                    
                    {/* Special Menu Items */}
                    {Array.isArray(r.specialMenuItems) && r.specialMenuItems.length > 0 && (
                      <div className="mt-5">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Signature Dishes</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {r.specialMenuItems.map(mi => (
                            <div key={mi.menuItemId} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-slate-800 truncate">{mi.name}</div>
                                <div className="text-[10px] text-slate-500 truncate mt-0.5">{mi.description}</div>
                              </div>
                              <div className="text-xs font-black text-rose-600 shrink-0">₹{mi.price}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-5 flex gap-2">
                      <Link 
                        to={`/restaurant/${r.restaurantId}`} 
                        className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
                      >
                        Order Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div className="col-span-full text-center text-slate-500 py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-bold text-slate-700">No restaurants match your search</h3>
              <p className="text-slate-400 text-xs mt-1">Try clearing your filters or changing your search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilteredRestaurant;
