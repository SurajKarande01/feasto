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
    <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col hover:shadow-lg transition-all duration-300 overflow-hidden">
      {src ? (
        <div className="w-full h-44 mb-4 bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100">
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
        <div className="w-full h-44 mb-4 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-semibold border border-dashed border-slate-200">
          No Image
        </div>
      )}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-extrabold text-slate-900 truncate text-base">{item.name}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onEdit(item)}
                title="Edit"
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200/50 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(item)}
                title="Delete"
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-100/50 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          {item.description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>}
        </div>
        <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between">
          <span className="font-black text-slate-950 text-lg">₹{item.price}</span>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/40 uppercase tracking-wider">{item.category}</span>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
            item.isAvailable 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100/60" 
              : "bg-rose-50 text-rose-700 border-rose-100/60"
          }`}>
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
        const url = `/restaurants/${rid}/menu/${editingItem.menuItemId}`;
        await apiClient.put(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Menu item updated successfully");
      } else {
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
    <div className="min-h-screen pb-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
          <div>
            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Catalog Manager</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Menu Management</h1>
            <p className="text-slate-500 text-sm mt-1">Add, update or delete your restaurant menu items</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={doFetch} 
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Refresh
            </button>
            <button 
              onClick={handleCreateNew} 
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all duration-200 cursor-pointer"
            >
              + Add Menu Item
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 font-semibold text-xs mt-3 tracking-wide">Loading menu items…</span>
          </div>
        )}
        {error && <div className="text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl py-4 font-semibold text-sm">{error}</div>}

        {!loading && !error && menu.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="text-5xl mb-4">🍳</div>
            <h3 className="text-base font-bold text-slate-700">Your menu is empty</h3>
            <p className="text-slate-400 text-xs mt-1 mb-6">Add your first menu item to start receiving orders!</p>
            <button 
              onClick={handleCreateNew} 
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={closeModal} />
            <div className="relative bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-6 md:p-8 overflow-y-auto max-h-[85vh] border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Dish Details</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-500"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name *</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    value={formValues.name}
                    onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
                    placeholder="E.g. Butter Chicken"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm resize-none"
                    value={formValues.description}
                    onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))}
                    placeholder="Short description of the dish..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (₹) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      value={formValues.price}
                      onChange={(e) => setFormValues((v) => ({ ...v, price: e.target.value }))}
                      placeholder="299"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category *</label>
                    <input
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      value={formValues.category}
                      onChange={(e) => setFormValues((v) => ({ ...v, category: e.target.value }))}
                      placeholder="E.g. Main Course"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formValues.isAvailable}
                    onChange={(e) => setFormValues((v) => ({ ...v, isAvailable: e.target.checked }))}
                    className="h-4.5 w-4.5 text-rose-600 focus:ring-rose-500/10 border-slate-300 rounded-lg cursor-pointer"
                  />
                  <label htmlFor="isAvailable" className="text-xs font-bold text-slate-600 cursor-pointer">Available for ordering</label>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 file:cursor-pointer"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3 border-t border-slate-50 pt-5">
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
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