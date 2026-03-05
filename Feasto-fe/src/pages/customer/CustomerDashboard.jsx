import { useMemo } from "react";
import Footer from "../../components/common/Footer";
import FilteredRestaurant from "../../components/customer/FilteredRestaurant";
import CustomerTopNav from "../../components/customer/TopNav";

function CustomerDashboard() {
  const customerName = useMemo(() => {
    try {
      const raw = localStorage.getItem("customerProfile");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj?.name || obj?.email || null;
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="min-h-screen">
      <CustomerTopNav name={customerName} />
      <div className="pt-6 pb-6">
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <h1 className="text-2xl font-semibold">Discover restaurants</h1>
          <p className="text-gray-600">Find something you like and start your order.</p>
        </div>
        <FilteredRestaurant />
      </div>
      <Footer />
    </div>
  );
}

export default CustomerDashboard;
