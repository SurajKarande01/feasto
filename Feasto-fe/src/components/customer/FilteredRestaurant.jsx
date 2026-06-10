import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getRandomRestaurants, searchRestaurants, getNearbyRestaurants } from "../../services/api/restaurantService";

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
        // Use backend search API
        const res = await searchRestaurants(search);
        data = res.content || res || [];
      } else if (locationMode === "nearby" && coords) {
        // Use backend nearby API
        const res = await getNearbyRestaurants({
          mylat: coords.lat,
          mylon: coords.lon,
          maxDistanceKm: 100,
          limit: 20
        });
        data = res.content || res || [];
      } else {
        // Fallback to random restaurants
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
    <div className="max-w-7xl mx-auto px-4">
      {/* Search & Filter Bar */}
      <div className="bg-white/95 rounded-2xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, cuisine..."
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all bg-gray-50"
            />
          </div>
          
          <select 
            value={cuisine} 
            onChange={(e)=>setCuisine(e.target.value)} 
            className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50"
          >
            <option value="">All Cuisines</option>
            {cuisines.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select 
            value={city} 
            onChange={(e)=>setCity(e.target.value)} 
            className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50"
          >
            <option value="">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select 
            value={sort} 
            onChange={(e)=>setSort(e.target.value)} 
            className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50"
          >
            <option value="name_asc">Sort: Name A-Z</option>
            <option value="name_desc">Sort: Name Z-A</option>
            <option value="rating_desc">Sort: Rating High</option>
            <option value="distance_asc">Sort: Distance Nearest</option>
          </select>
        </div>

        {/* Location status badge */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div>
            {locationMode === "detecting" && <span>📍 Detecting your location...</span>}
            {locationMode === "nearby" && <span className="text-emerald-600 font-medium">📍 Showing nearby restaurants first</span>}
            {locationMode === "fallback" && <span>🔍 Showing popular restaurants (location unavailable)</span>}
          </div>
          {coords && (
            <span className="text-gray-400">Lat: {coords.lat.toFixed(4)}, Lon: {coords.lon.toFixed(4)}</span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500 text-sm mt-3">Fetching restaurants…</span>
        </div>
      )}
      
      {error && <div className="text-center text-red-600 py-4 font-medium">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 pb-8">
          {filtered.map(r => {
            const addr = r.address || {};
            const rating = r.rating ?? "—";
            const distance = r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km` : "—";
            return (
              <div key={r.restaurantId} className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <div className="md:col-span-1 overflow-hidden flex items-center justify-center p-4">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={`${r.name}`}
                        className="w-full h-48 md:h-36 object-cover rounded-xl"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-36 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3 p-4 pl-0 md:pl-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{r.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{r.cuisineType || "Cuisine"}</p>
                      </div>
                      <div className="text-sm text-gray-600 flex gap-4 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                        <span>⭐ <span className="font-semibold text-gray-900">{rating}</span></span>
                        <span>📍 <span className="font-semibold text-gray-900">{distance}</span></span>
                      </div>
                    </div>
                    {r.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{r.description}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-semibold">Address:</span>
                      <span> {addr.street ? `${addr.street}, ` : ""}{addr.city || ""}{addr.state ? `, ${addr.state}` : ""}{addr.postalCode ? `, ${addr.postalCode}` : ""}</span>
                    </div>
                    
                    {/* Special Menu Items */}
                    {Array.isArray(r.specialMenuItems) && r.specialMenuItems.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Signature Dishes</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {r.specialMenuItems.map(mi => (
                            <div key={mi.menuItemId} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-gray-950">{mi.name}</div>
                                <div className="text-xs text-gray-500 line-clamp-1">{mi.description}</div>
                              </div>
                              <div className="text-sm font-bold text-gray-900">₹{mi.price}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex gap-2">
                      <Link 
                        to={`/restaurant/${r.restaurantId}`} 
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
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
            <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-2xl border">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700">No restaurants match your search</h3>
              <p className="text-gray-500 text-sm mt-1">Try clearing your filters or changing your search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilteredRestaurant;
