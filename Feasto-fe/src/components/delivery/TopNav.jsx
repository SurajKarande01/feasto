import { NavLink, useNavigate } from "react-router-dom";

export default function TopNav() {
  const navigate = useNavigate();

  const linkBase = "px-3 py-2 rounded hover:bg-gray-100";
  const active = ({ isActive }) => (isActive ? "bg-gray-200 " + linkBase : linkBase);

  const handleLogout = () => {
    try {
      localStorage.removeItem("deliveryProfile");
      localStorage.removeItem("deliveryToken");
    } catch (err) {
      console.warn("Failed to clear delivery storage", err);
    }
    navigate("/welcome");
  };

  return (
    <div className="w-full bg-white shadow mb-4">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="font-semibold">Delivery Partner</div>
        <nav className="flex items-center gap-2">
          <NavLink to="/delivery-dashboard" className={active}>Dashboard</NavLink>
          <NavLink to="/assigned-orders" className={active}>Assigned Orders</NavLink>
          <NavLink to="/delivery-profile" className={active}>Profile</NavLink>
          <button onClick={handleLogout} className="px-3 py-2 rounded bg-red-50 text-red-600 hover:bg-red-100">Logout</button>
        </nav>
      </div>
    </div>
  );
}
