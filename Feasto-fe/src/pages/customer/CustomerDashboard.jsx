
import Footer from "../../components/common/Footer";
import FilteredRestaurant from "../../components/customer/FilteredRestaurant";


function CustomerDashboard() {


  return (
    <div className="min-h-screen">
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
