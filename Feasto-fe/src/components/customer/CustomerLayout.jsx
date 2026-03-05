import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import CustomerTopNav from "./TopNav";

const CustomerLayout = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("customerProfile");
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const name = profile?.name || "Customer";

  return (
    <div className="min-h-screen">
      <CustomerTopNav name={name} />
      <main className="max-w-7xl mx-auto w-full px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
