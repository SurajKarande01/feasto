import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";

const DeliveryLayout = () => {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-7xl mx-auto w-full px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default DeliveryLayout;
