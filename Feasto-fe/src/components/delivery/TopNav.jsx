import { NavLink, useNavigate } from "react-router-dom";

export default function TopNav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem("deliveryProfile");
      localStorage.removeItem("token");
    } catch (err) {
      console.warn("Failed to clear delivery storage", err);
    }
    navigate("/welcome");
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.015)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/delivery-dashboard")}>
          <span className="text-rose-500 font-black tracking-wider text-base">Feasto</span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            Rider
          </span>
        </div>

        <nav className="flex items-center gap-1.5">
          <NavLink 
            to="/delivery-dashboard" 
            className={({ isActive }) => 
              `px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "bg-slate-950 text-white shadow-sm" 
                  : "bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-950"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/assigned-orders" 
            className={({ isActive }) => 
              `px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "bg-slate-950 text-white shadow-sm" 
                  : "bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-950"
              }`
            }
          >
            Assignments
          </NavLink>
          <NavLink 
            to="/delivery-profile" 
            className={({ isActive }) => 
              `px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "bg-slate-950 text-white shadow-sm" 
                  : "bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-950"
              }`
            }
          >
            Profile
          </NavLink>
          <button 
            onClick={handleLogout} 
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer bg-rose-50 text-rose-600 hover:bg-rose-100"
          >
            Logout
          </button>
        </nav>

      </div>
    </div>
  );
}
