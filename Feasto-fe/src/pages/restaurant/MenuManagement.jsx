import apiClient from "../../services/api/apiClient";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";

const buildCloudinaryUrl = (cloudName, publicId, w, h) => {
  if (!cloudName || !publicId) return null;
  try {
    const cld = new Cloudinary({ cloud: { cloudName } });
    const img = cld
      .image(publicId)
      .resize(fill().width(w).height(h))
      .format("auto")
      .quality("auto");
    return img.toURL();
  } catch {
    return null;
  }
};

const extractCloudinaryInfo = (item) => {
  if (item.cloudinaryPublicId) {
    let cloudName = null;
    if (item.imageUrl) {
      const m = item.imageUrl.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload/);
      if (m) cloudName = m[1];
    }
    if (!cloudName) cloudName = "dp80vdscp";
    return { cloudName, publicId: item.cloudinaryPublicId };
  }

  if (item.imageUrl) {
    const m = item.imageUrl.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/);
    if (m) {
      const cloudName = m[1];
      let rest = m[2];
      rest = rest.replace(/^v\d+\//, "");
      rest = rest.replace(/\.[a-zA-Z0-9]+$/, "");
      return { cloudName, publicId: rest };
    }
  }
  return null;
};

const MenuCard = ({ item, onDelete, onEdit }) => {
  const info = extractCloudinaryInfo(item);
  const widths = [300, 600, 900];
  const ratio = 2 / 3;
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
    const defaultW = 400;
    const defaultH = Math.round(defaultW * ratio);
    src = buildCloudinaryUrl(info.cloudName, info.publicId, defaultW, defaultH) || item.imageUrl;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col hover:shadow-md transition-shadow overflow-hidden">
      {src ? (
        <div className="w-full h-40 mb-3 bg-gray-100 rounded-xl overflow-hidden relative">
          <img
            src={src}
            srcSet={srcSet || undefined}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-40 mb-3 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200">
          No Image
        </div>
      )}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onEdit(item)}
                title="Edit"
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(item)}
                title="Delete"
                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className="font-extrabold text-gray-900 text-lg">₹{item.price}</span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">{item.category}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.isAvailable ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {item.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>
    </div>
  );
};

const MenuManagement = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if creating
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
      return p.id ?? p.restaurantId ?? null;
    } catch {
      return null;
    }
  };

  const doFetch = async () => {
    const rid = getRestaurantId();
    if (!rid) {
      setError("No restaurant profile found. Please login.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(`/restaurants/${rid}/menu`);
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
    } catch (err) {
      console.error(err);
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    doFetch();
  }, []);

  const handleDelete = async (item) => {
    const rid = getRestaurantId();
    if (!rid) return;
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      await apiClient.delete(`/restaurants/${rid}/menu/${item.menuItemId}`);
      setMenu((m) => m.filter((x) => x.menuItemId !== item.menuItemId));
      toast.success("Menu item deleted successfully");
    } catch {
      toast.error("Failed to delete menu item");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormValues({
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      category: item.category || "",
      isAvailable: !!item.isAvailable,
    });
    setFiles([]);
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setFormValues({
      name: "",
      description: "",
      price: "",
      category: "",
      isAvailable: true,
    });
    setFiles([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFiles([]);
  };

  const onFileChange = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const rid = getRestaurantId();
    if (!rid) {
      toast.error("Restaurant ID missing");
      return;
    }
    if (!formValues.name.trim() || !formValues.price || !formValues.category.trim()) {
      toast.error("Please fill in Name, Price, and Category");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
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
      if (files.length > 0) {
        fd.append("image", files[0]);
      }

      if (editingItem) {
        // Edit Mode
        const url = `/restaurants/${rid}/menu/${editingItem.menuItemId}`;
        await apiClient.put(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Menu item updated successfully");
      } else {
        // Create Mode
        const url = `/restaurants/${rid}/menu`;
        await apiClient.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Menu item added successfully");
      }
      doFetch();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-sm text-gray-500 mt-1">Add, update or delete your restaurant menu items</p>
          </div>
          <div className="flex gap-2">
            <button onClick={doFetch} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-gray-50 bg-white">
              Refresh
            </button>
            <button onClick={handleCreateNew} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
              + Add Menu Item
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-16 text-gray-500">Loading menu…</div>}
        {error && <div className="text-center text-red-600 py-16 font-medium">{error}</div>}

        {!loading && !error && menu.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <div className="text-5xl mb-3">🍳</div>
            <h3 className="text-lg font-semibold text-gray-700">Your menu is empty</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">Add your first menu item to start receiving orders!</p>
            <button onClick={handleCreateNew} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
              Add Menu Item
            </button>
          </div>
        )}

        {!loading && !error && menu.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/45" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label>
                  <input
                    required
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white transition-all"
                    value={formValues.name}
                    onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
                    placeholder="E.g. Butter Chicken"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white transition-all"
                    value={formValues.description}
                    onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))}
                    placeholder="Short description of the dish..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white transition-all"
                      value={formValues.price}
                      onChange={(e) => setFormValues((v) => ({ ...v, price: e.target.value }))}
                      placeholder="299"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                    <input
                      required
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white transition-all"
                      value={formValues.category}
                      onChange={(e) => setFormValues((v) => ({ ...v, category: e.target.value }))}
                      placeholder="E.g. Main Course"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formValues.isAvailable}
                    onChange={(e) => setFormValues((v) => ({ ...v, isAvailable: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">Available for ordering</label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
                    {saving ? "Saving..." : "Save Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuManagement;