import apiClient from "../../services/api/apiClient";
import { useEffect, useState } from "react";
// Cloudinary JS SDK
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";

const buildCloudinaryUrl = (cloudName, publicId, w, h) => {
  if (!cloudName || !publicId) return null;
  try {
    const cld = new Cloudinary({ cloud: { cloudName } });
    // build an image with resize, auto format and auto quality
    const img = cld
      .image(publicId)
      .resize(fill().width(w).height(h))
      .format("auto")
      .quality("auto");
    return img.toURL();
  } catch {
    // fallback to null so callers can use item.imageUrl
    return null;
  }
};

const extractCloudinaryInfo = (item) => {
  // Prefer explicit public id if provided by API
  if (item.cloudinaryPublicId) {
    // try to extract cloudName from imageUrl if available
    let cloudName = null;
    if (item.imageUrl) {
      const m = item.imageUrl.match(
        /res\.cloudinary\.com\/([^/]+)\/image\/upload/
      );
      if (m) cloudName = m[1];
    }
    // fallback cloud name (if your images use this cloud)
    if (!cloudName) cloudName = "dp80vdscp";
    return { cloudName, publicId: item.cloudinaryPublicId };
  }

  // fallback: attempt to parse a Cloudinary URL from imageUrl
  if (item.imageUrl) {
    const m = item.imageUrl.match(
      /res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/
    );
    if (m) {
      const cloudName = m[1];
      let rest = m[2];
      // remove version prefix like v12345/
      rest = rest.replace(/^v\d+\//, "");
      // strip extension
      rest = rest.replace(/\.[a-zA-Z0-9]+$/, "");
      return { cloudName, publicId: rest };
    }
  }

  return null;
};

const MenuCard = ({ item, onDelete, onEdit }) => {
  const info = extractCloudinaryInfo(item);
  // desired widths for srcset
  const widths = [300, 600, 900];
  const ratio = 2 / 3; // h = w * 2/3 (300x200)
  let src = item.imageUrl;
  let srcSet = null;
  if (info) {
    srcSet = widths
      .map((w) => {
        const h = Math.round(w * ratio);
        const u = buildCloudinaryUrl(info.cloudName, info.publicId, w, h);
        return `${u} ${w}w`;
      })
      .join(", ");
    // pick medium size as default
    const defaultW = 400;
    const defaultH = Math.round(defaultW * ratio);
    src =
      buildCloudinaryUrl(info.cloudName, info.publicId, defaultW, defaultH) ||
      item.imageUrl;
  }

  return (
    <div className="bg-white/90 rounded-lg shadow px-2 py-2 flex flex-col border hover:scale-[1.01] transition-transform overflow-hidden">
      <div
        className="w-full mb-2 bg-gray-100 relative"
        style={{ paddingTop: "56.25%" }}
      >
        <img
          src={src}
          srcSet={srcSet || undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          alt={item.name}
          className="absolute top-0 left-0 w-full rounded-2xl h-full object-cover"
        />
      </div>
      <div className="flex-1 px-2">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-md truncate">{item.name}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              title="Edit"
              className="p-1 rounded-full bg-blue-600 text-white hover:opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9a2 2 0 012.828 0z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(item)}
              title="Delete"
              className="p-1 rounded-full bg-red-600 text-white hover:opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1 truncate">
          {item.description}
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
          <div className="font-bold">₹{item.price}</div>
          <div
            className={`text-xs px-2 py-0.5 rounded ${
              item.isAvailable
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.isAvailable ? "Available" : "Unavailable"}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-blue-700 font-bold mt-1">{item.category}</div>
          {/* rating below availability */}
          {typeof item.rating !== "undefined" && (
            <div className="mt-1">
              <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-xs">{item.rating}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MenuManagement = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isAvailable: true,
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const getRestaurantId = () => {
    try {
      const raw = localStorage.getItem("restaurantProfile");
      if (!raw) return null;
      const p = JSON.parse(raw);
      // accept either id or restaurantId
      return p.id ?? p.restaurantId ?? null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const doFetch = async () => {
      const rid = getRestaurantId();
      if (!rid) {
        setError("No restaurant id found in localStorage");
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/restaurants/${rid}/menu`
        );
        // Robust check: handle if API returns array directly or wrapped in { data: ... }
        const raw = res.data;
        let data = [];
        if (Array.isArray(raw)) {
            data = raw;
        } else if (raw && Array.isArray(raw.data)) {
            data = raw.data;
        } else if (raw && Array.isArray(raw.menuItems)) {
            data = raw.menuItems;
        }
        
        console.log("Fetched Menu Data:", data); // Debug log to see what we got
        setMenu(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, []);

  const refresh = async () => {
    const rid = getRestaurantId();
    if (!rid) {
      setError("No restaurant id found in localStorage");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/restaurants/${rid}/menu`
      );
      // Robust check here as well
      const raw = res.data;
      let data = [];
      if (Array.isArray(raw)) {
          data = raw;
      } else if (raw && Array.isArray(raw.data)) {
          data = raw.data;
      } else if (raw && Array.isArray(raw.menuItems)) {
          data = raw.menuItems;
      }
      setMenu(data);
    } catch {
      setError("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const rid = getRestaurantId();
    if (!rid) return;
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await apiClient.delete(
        `/restaurants/${rid}/menu/${item.menuItemId}`
      );
      setMenu((m) => m.filter((x) => x.menuItemId !== item.menuItemId));
    } catch {
      alert("Delete failed");
    }
  };

  const handleEdit = (item) => {
    // open modal and populate
    setEditingItem(item);
    setFormValues({
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      category: item.category || "",
      isAvailable: !!item.isAvailable,
    });
    setFiles([]);
  };

  const closeModal = () => {
    setEditingItem(null);
    setFormValues({
      name: "",
      description: "",
      price: "",
      category: "",
      isAvailable: true,
    });
    setFiles([]);
    setSaving(false);
  };

  const onFileChange = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    const rid = getRestaurantId();
    if (!rid) {
      alert("Restaurant id missing");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      // menuItem as JSON string
      fd.append(
        "menuItem",
        JSON.stringify({
          name: formValues.name,
          description: formValues.description,
          price: parseFloat(formValues.price),
          category: formValues.category,
          isAvailable: !!formValues.isAvailable,
        })
      );
      // append first image under the field name 'image' expected by backend
      if (files && files.length > 0) {
        fd.append("image", files[0]);
      }

      const url = `/restaurants/${rid}/menu/${editingItem.menuItemId}`;
      // let apiClient set Content-Type with proper boundary
      await apiClient.put(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
      // refresh list
      await refresh();
      closeModal();
    } catch {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-8 ">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Menu Management</h2>
          <div>
            <button
              onClick={refresh}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-10">Loading...</div>}
        {error && <div className="text-center text-red-600 py-4">{error}</div>}

        {!loading && !error && menu.length === 0 && (
            <div className="text-center py-12 bg-white/50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">No menu items found.</p>
                <p className="text-sm text-gray-400">Add items to your database to see them here.</p>
            </div>
        )}

        {!loading && !error && menu.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map((item) => (
              <MenuCard
                key={item.menuItemId}
                item={item}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
        
        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Menu Item</h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  value={formValues.name}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, name: e.target.value }))
                  }
                  placeholder="Name"
                />
                <textarea
                  className="border rounded px-3 py-2"
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues((v) => ({
                      ...v,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <input
                    className="border rounded px-3 py-2 flex-1"
                    value={formValues.price}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, price: e.target.value }))
                    }
                    placeholder="Price"
                  />
                  <input
                    className="border rounded px-3 py-2 w-40"
                    value={formValues.category}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, category: e.target.value }))
                    }
                    placeholder="Category"
                  />
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formValues.isAvailable}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        isAvailable: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm">Available</span>
                </label>
                <div>
                  <label className="block text-sm mb-1">Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onFileChange}
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    className="px-3 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-2 bg-blue-600 text-white rounded"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;