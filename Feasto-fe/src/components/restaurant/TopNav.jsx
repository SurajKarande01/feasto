import { Link } from "react-router-dom";

export const TopNav = ({ name, onToggleMenu, onLogout }) => (
  <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow z-40">
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded hover:bg-gray-100"
          onClick={onToggleMenu}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="text-lg font-semibold">{name || "My Restaurant"}</div>
      </div>

      <nav className="hidden md:flex items-center gap-4">
        <Link to="/restaurant-dashboard" className="text-sm px-3 py-1 rounded hover:bg-gray-100">Home</Link>
        <Link to="/menu-management" className="text-sm px-3 py-1 rounded hover:bg-gray-100">Menu</Link>
        <Link to="/restaurant-orders" className="text-sm px-3 py-1 rounded hover:bg-gray-100">Orders</Link>
        <Link to="/restaurant-profile" className="text-sm px-3 py-1 rounded hover:bg-gray-100">Profile</Link>
        <button onClick={onLogout} className="text-sm px-3 py-1 bg-red-600 text-white rounded">Logout</button>
      </nav>
    </div>
  </header>
);

export const MobileMenu = ({ visible, onClose, onLogout }) => {
  if (!visible) return null;
  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 w-64 h-full bg-white shadow p-4">
        <button onClick={onClose} className="mb-4 p-2 rounded hover:bg-gray-100">Close</button>
        <ul className="space-y-2">
          <li><Link to="/menu-management" onClick={onClose} className="block">Menu</Link></li>
          <li><Link to="/restaurant-orders" onClick={onClose} className="block">Orders</Link></li>
          <li><Link to="/restaurant-profile" onClick={onClose} className="block">Profile</Link></li>
          <li><button onClick={() => { onLogout(); onClose(); }} className="w-full text-left text-red-600">Logout</button></li>
        </ul>
      </div>
    </div>
  );
};

export default TopNav;
