import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const FilteredRestaurant = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("name_asc");

  useEffect(() => {
    const fetchRandom = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:8080/api/restaurants/random");
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load restaurants");
      } finally {
        setLoading(false);
      }
    };
    fetchRandom();
  }, []);

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

  const filtered = useMemo(() => {
    let list = [...restaurants];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r =>
        (r.name || "").toLowerCase().includes(s) ||
        (r.cuisineType || "").toLowerCase().includes(s) ||
        (r.address?.city || "").toLowerCase().includes(s)
      );
    }
    if (cuisine) list = list.filter(r => r.cuisineType === cuisine);
    if (city) list = list.filter(r => r.address?.city === city);

    switch (sort) {
      case "name_desc":
        list.sort((a,b) => (b.name||"").localeCompare(a.name||""));
        break;
      case "rating_desc":
        list.sort((a,b) => (b.rating ?? -1) - (a.rating ?? -1));
        break;
      default:
        list.sort((a,b) => (a.name||"").localeCompare(b.name||""));
    }
    return list;
  }, [restaurants, search, cuisine, city, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="bg-white/90 rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, cuisine, city"
            className="w-full p-2 rounded border"
          />
          <select value={cuisine} onChange={(e)=>setCuisine(e.target.value)} className="w-full p-2 rounded border">
            <option value="">All Cuisines</option>
            {cuisines.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={city} onChange={(e)=>setCity(e.target.value)} className="w-full p-2 rounded border">
            <option value="">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={sort} onChange={(e)=>setSort(e.target.value)} className="w-full p-2 rounded border">
            <option value="name_asc">Sort: Name A-Z</option>
            <option value="name_desc">Sort: Name Z-A</option>
            <option value="rating_desc">Sort: Rating High</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-center py-10">Loading restaurants…</div>}
      {error && <div className="text-center text-red-600 py-4">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 pb-6">
          {filtered.map(r => {
            const addr = r.address || {};
            const rating = r.rating ?? "—";
            const distance = r.distanceKm != null ? `${r.distanceKm} km` : "—";
            return (
              <div key={r.restaurantId} className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 items-start">
                  <div className="md:col-span-1 mt-3  md:mt-0 overflow-hidden flex items-center justify-center self-center place-self-center">
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={`${r.name} image`}
                        className="max-w-full max-h-72 md:max-h-80 object-contain rounded-2xl"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextSibling;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`px-4 py-6 flex items-center justify-center text-gray-400 ${r.imageUrl ? 'hidden' : ''}`}>
                      Restaurant image
                    </div>
                  </div>
                  <div className="md:col-span-3 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <div className="text-xl font-semibold">{r.name}</div>
                        <div className="text-sm text-gray-600">{r.cuisineType || "Cuisine"}</div>
                      </div>
                      <div className="text-sm text-gray-700 flex gap-4">
                        <span><span className="font-medium">Rating:</span> {rating}</span>
                        <span><span className="font-medium">Distance:</span> {distance}</span>
                      </div>
                    </div>
                    {r.description && (
                      <p className="mt-2 text-gray-700">{r.description}</p>
                    )}
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Address:</span>
                      <span> {addr.street ? `${addr.street}, ` : ""}{addr.city || ""}{addr.state ? `, ${addr.state}` : ""}{addr.postalCode ? `, ${addr.postalCode}` : ""}{addr.country ? `, ${addr.country}` : ""}</span>
                    </div>
                    <div className="mt-3">
                      <div className="font-semibold mb-2">Special menu items</div>
                      {Array.isArray(r.specialMenuItems) && r.specialMenuItems.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {r.specialMenuItems.map(mi => (
                            <div key={mi.menuItemId} className="p-3 rounded border border-black/5 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{mi.name}</div>
                                <div className="text-sm text-gray-700">₹{mi.price}</div>
                              </div>
                              <div className="text-xs text-gray-600">{mi.category}</div>
                              {mi.description && (
                                <div className="text-sm text-gray-700 mt-1 line-clamp-2">{mi.description}</div>
                              )}
                              <div className={`mt-1 text-xs ${mi.isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                                {mi.isAvailable ? 'Available' : 'Unavailable'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">No special items listed</div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Link to={`/restaurant/${r.restaurantId}`} className="inline-block text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">View restaurant Menus</Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div className="col-span-full text-center text-gray-600 py-10">No restaurants match your filters</div>
          )}
        </div>
      )}
    </div>
  );
}
;

export default FilteredRestaurant;
