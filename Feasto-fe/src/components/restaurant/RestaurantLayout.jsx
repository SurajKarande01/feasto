import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import TopNav, { MobileMenu } from "./TopNav";

const RestaurantLayout = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("restaurantProfile");
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("restaurantProfile");
    } catch {
      // ignore
    }
    navigate('/welcome');
  };

  const name = profile?.name || "Restaurant";

  return (
    <div className="min-h-screen ">
      <TopNav name={name} onToggleMenu={() => setShowMenu(s => !s)} onLogout={handleLogout} />
      <MobileMenu visible={showMenu} onClose={() => setShowMenu(false)} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto w-full px-4 mt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default RestaurantLayout;
