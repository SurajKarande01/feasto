import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/apiClient';
import { 
  Utensils, MapPin, Star, Plus, Settings, ShoppingBag, 
  Trash2, Edit3, ChefHat, Clock, Search, X, Check, 
  Image as ImageIcon, Loader2, AlertCircle
} from 'lucide-react';

// --- Sub-Component: Loading Skeleton ---
const SkeletonLoader = () => (
  <div className="animate-pulse min-h-screen bg-white">
    <div className="h-72 bg-slate-100 w-full"></div>
    <div className="container mx-auto px-6 -mt-16 relative">
      <div className="h-32 w-32 bg-slate-200 rounded-3xl mb-6 border-4 border-white"></div>
      <div className="space-y-4 max-w-2xl">
        <div className="h-10 bg-slate-200 rounded-xl w-3/4"></div>
        <div className="h-6 bg-slate-200 rounded-xl w-1/2"></div>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-slate-100 rounded-3xl"></div>)}
      </div>
    </div>
  </div>
);

// --- Sub-Component: Menu Item Card ---
const MenuCard = ({ item, onDelete }) => (
  <div className="group bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-lg border border-slate-100/80 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
    <div className="flex gap-5 h-full">
      {/* Image Section */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <img 
          src={item.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
          alt={item.name} 
          className="w-full h-full object-cover rounded-2xl shadow-sm bg-slate-50 border border-slate-100" 
        />
        <div className="absolute top-2 left-2 bg-rose-50 text-rose-700 border border-rose-100/40 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
           {item.category || 'Dish'}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-grow flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-rose-500 transition-colors truncate">
              {item.name}
            </h3>
            <span className="font-black text-rose-500 text-sm shrink-0">
              ₹{item.price}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {item.description || "No description provided."}
          </p>
        </div>
        
        {/* Actions Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <Clock size={12} className="text-rose-500" /> 
                <span>15-20 min</span>
            </div>
            <div className="flex gap-1.5">
                <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                    <Edit3 size={15}/>
                </button>
                <button 
                    onClick={() => onDelete(item.menuItemId)} 
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                    <Trash2 size={15}/>
                </button>
            </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Sub-Component: Add Dish Form ---
const AddDishForm = ({ onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    imageFile: null,
    imagePreview: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageFile: file, imagePreview: objectUrl }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("Name and Price are required");
    onSave(formData);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up my-8">
      <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
        <div>
            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Dish Details</span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Add New Item</h2>
        </div>
        <button onClick={onCancel} className="p-2 bg-white hover:bg-slate-100 rounded-xl shadow-sm border border-slate-100 transition-colors cursor-pointer">
            <X size={16} className="text-slate-500"/>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {/* Image Upload */}
        <div className="flex justify-center mb-4">
            {!formData.imagePreview ? (
                <div className="w-full h-44 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-rose-50/25 hover:border-rose-300 transition-all cursor-pointer relative group">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                    <div className="bg-white p-3 rounded-full shadow-sm mb-2.5 group-hover:scale-110 transition-transform border border-slate-100">
                        <ImageIcon className="text-rose-500" size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Upload Dish Image</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">PNG, JPG up to 5MB</p>
                </div>
            ) : (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-sm group border border-slate-100">
                    <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: '' }))}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity cursor-pointer"
                    >
                        <Trash2 size={16} className="mr-2" /> Change Image
                    </button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dish Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" placeholder="e.g. Spicy Ramen"/>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500 transition-all cursor-pointer font-bold">
                    <option>Main Course</option>
                    <option>Appetizer</option>
                    <option>Dessert</option>
                    <option>Beverage</option>
                </select>
            </div>
        </div>

        <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (₹) *</label>
            <input required name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" placeholder="299"/>
        </div>

        <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm resize-none" placeholder="Describe ingredients, taste profile..."/>
        </div>

        <div className="pt-4 flex gap-3.5">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-600 active:scale-98 shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} 
                {isSaving ? 'Saving...' : 'Add Item'}
            </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Page Component ---
const RestaurantProfile = () => {
  const getRestaurantId = () => {
    try {
      const raw = localStorage.getItem("restaurantProfile");
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p?.id ?? p?.restaurantId ?? null;
    } catch { return null; }
  };
  const restaurantId = getRestaurantId(); 

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Data
  useEffect(() => {
    if (!restaurantId) {
      setError("No restaurant profile found. Please login as a restaurant owner.");
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resDetails, resMenu] = await Promise.all([
          apiClient.get(`/restaurants/${restaurantId}`),
          apiClient.get(`/restaurants/${restaurantId}/menu`)
        ]);
        setRestaurant(resDetails.data);
        setMenuItems(Array.isArray(resMenu.data) ? resMenu.data : []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not connect to Backend. Is Spring Boot running on Port 8080?");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  // 2. Delete Item
  const handleDeleteItem = async (menuItemId) => {
    if (window.confirm("Permanently delete this menu item?")) {
      try {
        await apiClient.delete(`/restaurants/${restaurantId}/menu/${menuItemId}`);
        setMenuItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
      } catch (err) {
        alert("Failed to delete item. Check console.");
      }
    }
  };

  // 3. Save Item
  const handleSaveDish = async (dishData) => {
    setIsSaving(true);
    try {
        const formData = new FormData();
        const menuItemJson = JSON.stringify({
            name: dishData.name,
            description: dishData.description,
            price: parseFloat(dishData.price),
            category: dishData.category,
            isAvailable: true,
            rating: 0.0
        });

        formData.append("menuItem", menuItemJson);
        if (dishData.imageFile) {
            formData.append("image", dishData.imageFile);
        }

        const response = await apiClient.post(
            `/restaurants/${restaurantId}/menu`, 
            formData
        );

        setMenuItems([response.data, ...menuItems]);
        setIsAddingDish(false);
    } catch (err) {
        console.error("Save failed", err);
        alert("Failed to save. Ensure Backend supports Multipart requests.");
    } finally {
        setIsSaving(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <SkeletonLoader />;

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-white flex-col gap-4 text-center px-6">
        <AlertCircle size={40} className="text-rose-500" />
        <h2 className="text-xl font-black text-slate-950 tracking-tight">Connection Error</h2>
        <p className="text-slate-400 text-xs max-w-xs">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 shadow-md shadow-rose-500/20 transition cursor-pointer">Try Again</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      
      {/* Hero Header */}
      <div className="relative pb-20">
        <div className="absolute inset-0 h-80 bg-gradient-to-br from-slate-950 to-slate-800 overflow-hidden rounded-b-[48px] shadow-sm">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             {restaurant?.imageUrl && (
                 <img src={restaurant.imageUrl} alt="Cover" className="w-full h-full object-cover opacity-40 blur-xsScale" />
             )}
        </div>

        <div className="max-w-7xl mx-auto px-6 relative pt-28">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10 border border-slate-100/60">
            
            {/* Logo */}
            <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-2xl shadow-lg p-2 -mt-16 md:-mt-20 flex-shrink-0 border border-slate-100">
                <div className="w-full h-full rounded-xl overflow-hidden bg-rose-50 relative flex items-center justify-center border border-slate-100">
                    {restaurant?.imageUrl ? (
                        <img src={restaurant.imageUrl} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                        <Utensils size={32} className="text-rose-300"/>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="flex-grow text-center md:text-left space-y-2 w-full min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">{restaurant?.name || 'Restaurant Name'}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start shrink-0">
                    {restaurant?.isActive && (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border border-emerald-100/60 shadow-sm">
                        Open
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border border-rose-100/40 shadow-sm">
                      {restaurant?.cuisineType || 'Cuisine'}
                    </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-slate-400 text-xs font-bold pt-1">
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-rose-500"/> {restaurant?.address ? `${restaurant.address.city}, ${restaurant.address.state}` : 'Location Unavailable'}</span>
                <span className="flex items-center gap-1.5"><Star size={15} className="text-amber-500 fill-amber-500"/> {restaurant?.rating != null ? `${restaurant.rating.toFixed(1)} Rating` : 'New'}</span>
                <span className="flex items-center gap-1.5"><ChefHat size={15} className="text-rose-500"/> Verified Partner</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 self-start md:self-end">
              <button className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer">
                <Settings size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-1">
            <div className="flex gap-6">
                {['menu', 'orders', 'reviews'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => { setActiveTab(tab); setIsAddingDish(false); }}
                        className={`pb-4 text-xs font-black tracking-widest transition-all uppercase flex items-center gap-2 border-b-2 cursor-pointer
                            ${activeTab === tab 
                                ? 'border-rose-500 text-rose-500' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }
                        `}
                    >
                        {tab === 'menu' && <Utensils size={14}/>}
                        {tab === 'orders' && <ShoppingBag size={14}/>}
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'menu' && !isAddingDish && (
                 <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full lg:w-60">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                        <input 
                          type="text" 
                          placeholder="Search menu..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-rose-500 transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddingDish(true)} 
                        className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                        <Plus size={16}/> <span>Add Dish</span>
                    </button>
                 </div>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isAddingDish ? (
            <AddDishForm onSave={handleSaveDish} onCancel={() => setIsAddingDish(false)} isSaving={isSaving} />
        ) : (
            <>
                {activeTab === 'menu' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMenuItems.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50/50 rounded-3xl border border-slate-100">
                                <Utensils className="mx-auto mb-4 opacity-20" size={54}/>
                                <p className="text-sm font-semibold text-slate-600">No items found in menu</p>
                                <button onClick={() => setIsAddingDish(true)} className="text-rose-500 font-extrabold text-xs hover:underline mt-2">Create your first dish</button>
                            </div>
                        ) : (
                            filteredMenuItems.map((item) => (
                                <MenuCard key={item.menuItemId} item={item} onDelete={handleDeleteItem} />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100 text-center">
                        <div className="bg-white p-4 rounded-full mb-3 border border-slate-100 shadow-sm">
                            <ShoppingBag className="text-rose-400 w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-slate-700">Module Under Development</h3>
                        <p className="text-slate-400 text-xs mt-1">The {activeTab} analytics panel is coming soon.</p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default RestaurantProfile;