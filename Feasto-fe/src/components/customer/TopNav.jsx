import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CustomerTopNav = ({ name }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("customerProfile");
      localStorage.removeItem("token");
    } catch (e) {
      void e;
    }
    navigate("/welcome");
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-50 border border-slate-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Toggle menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20M4 12H20M4 18H20"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div 
            onClick={() => navigate("/customer-dashboard")} 
            className="text-lg font-black tracking-tight text-slate-900 cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            {name || "Feasto"}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <Link to="/customer-dashboard" className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all duration-200">Home</Link>
          <Link to="/orders" className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all duration-200">My Orders</Link>
          <Link to="/profile" className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all duration-200">Profile</Link>
          <button onClick={handleLogout} className="text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-sm">Logout</button>
        </nav>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 w-72 h-full bg-white shadow-2xl p-6 flex flex-col justify-between border-r border-slate-100">
            <div>
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Feasto
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/customer-dashboard" 
                    onClick={() => setMobileOpen(false)} 
                    className="block text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-4 py-3 rounded-xl transition-all"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/orders" 
                    onClick={() => setMobileOpen(false)} 
                    className="block text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-4 py-3 rounded-xl transition-all"
                  >
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/profile" 
                    onClick={() => setMobileOpen(false)} 
                    className="block text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-4 py-3 rounded-xl transition-all"
                  >
                    Profile
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm py-3.5 rounded-xl transition-all cursor-pointer text-center"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default CustomerTopNav;
