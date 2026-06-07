import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/apiClient';
import { useParams } from 'react-router-dom';
import { 
  Utensils, MapPin, Star, Plus, Settings, ShoppingBag, 
  Trash2, Edit3, ChefHat, Clock, Search, X, Check, 
  Image as ImageIcon, Loader2, AlertCircle
} from 'lucide-react';

// --- Sub-Component: Loading Skeleton ---
const SkeletonLoader = () => (
  <div className="animate-pulse min-h-screen bg-gray-50">
    <div className="h-72 bg-gray-300 w-full"></div>
    <div className="container mx-auto px-6 -mt-16 relative">
      <div className="h-32 w-32 bg-gray-200 rounded-2xl mb-6 border-4 border-white"></div>
      <div className="space-y-4 max-w-2xl">
        <div className="h-10 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>)}
      </div>
    </div>
  </div>
);

// --- Sub-Component: Menu Item Card ---
const MenuCard = ({ item, onDelete }) => (
  <div className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
    <div className="flex gap-5 h-full">
      {/* Image Section */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <img 
          src={item.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
          alt={item.name} 
          className="w-full h-full object-cover rounded-xl shadow-sm bg-gray-50" 
        />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-500 uppercase tracking-wide border border-gray-100">
           {item.category || 'Dish'}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-orange-600 transition-colors">
              {item.name}
            </h3>
            <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-sm">
                ${item.price}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {item.description || "No description provided."}
          </p>
        </div>
        
        {/* Actions Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <Clock size={14} className="text-orange-400" /> 
                <span>15-20 min</span>
            </div>
            <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 size={18}/>
                </button>
                {/* IMPORTANT: Using menuItemId from Java Entity */}
                <button 
                    onClick={() => onDelete(item.menuItemId)} 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={18}/>
                </button>
            </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Sub-Component: Add Dish Form (Refined, No Preview) ---
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
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up my-8">
      <div className="bg-gradient-to-r from-orange-50 to-white px-8 py-6 border-b border-gray-100 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Add New Item</h2>
            <p className="text-sm text-gray-500">Add a delicious dish to your menu</p>
        </div>
        <button onClick={onCancel} className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-sm border border-gray-100 transition-colors">
            <X size={20} className="text-gray-500"/>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Image Upload - Centered & Prominent */}
        <div className="flex justify-center mb-6">
            {!formData.imagePreview ? (
                <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-orange-50 hover:border-orange-300 transition-all cursor-pointer relative group">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon className="text-orange-500" size={28} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Upload Dish Image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
            ) : (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm group">
                    <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: '' }))}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-medium transition-opacity"
                    >
                        <Trash2 size={20} className="mr-2" /> Change Image
                    </button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Dish Name</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="e.g. Spicy Ramen"/>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer">
                    <option>Main Course</option>
                    <option>Appetizer</option>
                    <option>Dessert</option>
                    <option>Beverage</option>
                </select>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Price ($)</label>
            <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="0.00"/>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none" placeholder="Describe ingredients, taste profile..."/>
        </div>

        <div className="pt-4 flex gap-4">
            <button type="button" onClick={onCancel} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} 
                {isSaving ? 'Saving...' : 'Add Item'}
            </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Page Component ---
const RestaurantProfile = () => {
  // Uses React Router v6 parameters
  const { id } = useParams();
  // IMPORTANT: Ensure this ID exists in your PostgreSQL database
  const restaurantId = id || 1; 

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [isAddingDish, setIsAddingDish] = useState(false);

  // 1. Fetch Data (Compatible with RestaurantController endpoints)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resDetails, resMenu] = await Promise.all([
          apiClient.get(`/restaurants/${restaurantId}`),
          apiClient.get(`/restaurants/${restaurantId}/menu`)
        ]);
        setRestaurant(resDetails.data);
        setMenuItems(resMenu.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not connect to Backend. Is Spring Boot running on Port 8080?");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  // 2. Delete Item (Matches DELETE endpoint)
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

  // 3. Save Item (Matches POST endpoint with Multipart File)
  const handleSaveDish = async (dishData) => {
    setIsSaving(true);
    try {
        const formData = new FormData();
        
        // Match Java MenuItemDTO structure
        const menuItemJson = JSON.stringify({
            name: dishData.name,
            description: dishData.description,
            price: parseFloat(dishData.price),
            category: dishData.category,
            isAvailable: true,
            rating: 0.0 // Default
        });

        // 'menuItem' matches @RequestParam("menuItem") in Controller
        formData.append("menuItem", menuItemJson);
        
        // 'image' matches @RequestParam("image") in Controller
        if (dishData.imageFile) {
            formData.append("image", dishData.imageFile);
        }

        const response = await apiClient.post(
            `/restaurants/${restaurantId}/menu`, 
            formData, 
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        // Add response to state (assumes Backend returns the created object)
        setMenuItems([response.data, ...menuItems]);
        setIsAddingDish(false);
    } catch (err) {
        console.error("Save failed", err);
        alert("Failed to save. Ensure Backend supports Multipart requests.");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <SkeletonLoader />;

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4 text-center px-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold text-gray-800">Connection Error</h2>
        <p className="text-gray-600 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">Try Again</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-20">
      
      {/* --- Hero Header --- */}
      <div className="relative pb-20">
        <div className="absolute inset-0 h-80 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
             {/* Fallback pattern or real image background */}
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             {restaurant?.imageUrl && (
                 <img src={restaurant.imageUrl} alt="Cover" className="w-full h-full object-cover opacity-40" />
             )}
        </div>

        <div className="container mx-auto px-6 relative pt-24">
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10 backdrop-blur-xl bg-white/95 border border-white/20">
            
            {/* Logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl shadow-lg p-2 -mt-20 md:-mt-24 flex-shrink-0">
                <div className="w-full h-full rounded-xl overflow-hidden bg-orange-50 relative flex items-center justify-center border border-gray-100">
                    {restaurant?.imageUrl ? (
                        <img src={restaurant.imageUrl} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                        <Utensils size={40} className="text-orange-300"/>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="flex-grow text-center md:text-left space-y-2 w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{restaurant?.name || 'Restaurant Name'}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                    {restaurant?.isActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200">Open</span>}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full border border-gray-200">{restaurant?.cuisineType || 'Cuisine'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-gray-500 font-medium pt-1">
                <span className="flex items-center gap-2"><MapPin size={18} className="text-orange-500"/> {restaurant?.address ? `${restaurant.address.city}, ${restaurant.address.state}` : 'Location Unavailable'}</span>
                <span className="flex items-center gap-2"><Star size={18} className="text-yellow-400 fill-yellow-400"/> {restaurant?.rating || 'New'} Rating</span>
                <span className="flex items-center gap-2"><ChefHat size={18} className="text-blue-500"/> Owner Managed</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <Settings size={20}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Navigation & Controls --- */}
      <div className="container mx-auto px-6 mt-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-200 pb-1">
            
            {/* Tabs */}
            <div className="flex gap-8">
                {['menu', 'orders', 'reviews'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => { setActiveTab(tab); setIsAddingDish(false); }}
                        className={`pb-4 text-sm font-bold tracking-wide transition-all uppercase flex items-center gap-2 border-b-2
                            ${activeTab === tab 
                                ? 'border-orange-500 text-orange-600' 
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                            }
                        `}
                    >
                        {tab === 'menu' && <Utensils size={16}/>}
                        {tab === 'orders' && <ShoppingBag size={16}/>}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Filters (Only show on Menu tab) */}
            {activeTab === 'menu' && !isAddingDish && (
                 <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input type="text" placeholder="Search menu..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"/>
                    </div>
                    <button 
                        onClick={() => setIsAddingDish(true)} 
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
                    >
                        <Plus size={18}/> <span className="hidden sm:inline">Add Dish</span>
                    </button>
                 </div>
            )}
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="container mx-auto px-6 py-8">
        {isAddingDish ? (
            <AddDishForm onSave={handleSaveDish} onCancel={() => setIsAddingDish(false)} isSaving={isSaving} />
        ) : (
            <>
                {activeTab === 'menu' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                        {menuItems.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-gray-400">
                                <Utensils className="mx-auto mb-4 opacity-20" size={64}/>
                                <p className="text-lg">No items in menu yet.</p>
                                <button onClick={() => setIsAddingDish(true)} className="text-orange-600 font-bold hover:underline mt-2">Create your first dish</button>
                            </div>
                        ) : (
                            menuItems.map((item) => (
                                <MenuCard key={item.menuItemId} item={item} onDelete={handleDeleteItem} />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <ShoppingBag className="text-gray-300 w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Module Under Development</h3>
                        <p className="text-gray-400 mt-2">The {activeTab} feature is coming soon.</p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default RestaurantProfile;