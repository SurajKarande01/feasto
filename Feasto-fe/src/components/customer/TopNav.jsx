import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CustomerTopNav = ({ name }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("customerProfile");
      localStorage.removeItem("customerToken");
    } catch (e) {
      void e;
    }
    navigate("/welcome");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Toggle menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20M4 12H20M4 18H20"
                stroke="#111827"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="text-lg font-semibold">{name || "Feasto"}</div>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/customer-dashboard" className="text-sm px-3 py-1 rounded hover:bg-gray-100">Home</Link>
          <Link to="/orders" className="text-sm px-3 py-1 rounded hover:bg-gray-100">My Orders</Link>
          <Link to="/profile" className="text-sm px-3 py-1 rounded hover:bg-gray-100">Profile</Link>
          <button onClick={handleLogout} className="text-sm px-3 py-1 bg-red-600 text-white rounded">Logout</button>
        </nav>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 w-64 h-full bg-white shadow p-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="mb-4 p-2 rounded hover:bg-gray-100"
            >
              Close
            </button>
            <ul className="space-y-2">
              <li><Link to="/customer-dashboard" onClick={() => setMobileOpen(false)} className="block">Home</Link></li>
              <li><Link to="/orders" onClick={() => setMobileOpen(false)} className="block">My Orders</Link></li>
              <li><Link to="/profile" onClick={() => setMobileOpen(false)} className="block">Profile</Link></li>
              <li>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full text-left text-red-600"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default CustomerTopNav;
