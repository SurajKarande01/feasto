import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import Navbar from "./components/common/Navbar";
import ToastNotification from "./components/common/ToastNotification";
import ForgotPassword from "./pages/auth/ForgotPassword";

import CustomerLayout from "./components/customer/CustomerLayout";
import DeliveryLayout from "./components/delivery/DeliveryLayout";
import RestaurantLayout from "./components/restaurant/RestaurantLayout";
import Error404 from "./pages/common/Error404";
import Welcome from "./pages/common/Welcome";
import BecomeCustomer from "./pages/customer/BecomeCustomer";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerOrders from "./pages/customer/Orders";
import CustomerOrderTracking from "./pages/customer/OrderTracking";
import CustomerProfile from "./pages/customer/Profile";
import CustomerRestaurantDetail from "./pages/customer/RestaurantDetail";
import DeliveryAssignedOrders from "./pages/delivery/AssignedOrders";
import BecomeRider from "./pages/delivery/BecomeRider";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import DeliveryOrderDelivery from "./pages/delivery/OrderDelivery";
import DeliveryProfile from "./pages/delivery/Profile";
import RestaurantMenuManagement from "./pages/restaurant/MenuManagement";
import RestaurantOrders from "./pages/restaurant/Orders";
import PartnerWithUs from "./pages/restaurant/PartnerWithUs";
import RestaurantProfile from "./pages/restaurant/Profile";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";

// ---------------------------------------------------------------------------
// Helpers — defined at module level so they are never re-created on re-renders
// ---------------------------------------------------------------------------

/**
 * Utility function to inspect the browser local storage and deduce the user's role..
 * Inspects matching tokens and profile payloads to return 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', or 'CUSTOMER'.
 */
const getRoleFromLocalStorage = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    if (localStorage.getItem("restaurantProfile")) return "RESTAURANT_OWNER";
    if (localStorage.getItem("deliveryProfile")) return "DELIVERY_PARTNER";
    if (localStorage.getItem("customerProfile")) return "CUSTOMER";
  } catch (error) {
    console.error("Could not access localStorage", error);
  }
  return null;
};

/**
 * Decides the correct initial page to redirect the user to when they open the root URL.
 * Redirects guests to the /welcome page, and logged-in users to their respective dashboards.
 */
const getDefaultRoute = () => {
  const effectiveRole = getRoleFromLocalStorage();
  if (!effectiveRole) return <Navigate to="/welcome" />;
  switch (effectiveRole) {
    case "CUSTOMER":
      return <Navigate to="/customer-dashboard" />;
    case "RESTAURANT_OWNER":
      return <Navigate to="/restaurant-dashboard" />;
    case "DELIVERY_PARTNER":
      return <Navigate to="/delivery-dashboard" />;
    default:
      return <Navigate to="/error" />;
  }
};

/**
 * Route guard component that intercepts navigation request to protected URLs.
 * Checks the user's role, permitting access to matching nested layouts or redirecting them back to login or error pages.
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const effectiveRole = getRoleFromLocalStorage();

  if (!effectiveRole) return <Navigate to="/welcome" />;

  if (allowedRole) {
    if (allowedRole === "RESTAURANT_OWNER" && effectiveRole !== "RESTAURANT_OWNER")
      return <Navigate to="/error" />;
    if (allowedRole === "DELIVERY_PARTNER" && effectiveRole !== "DELIVERY_PARTNER")
      return <Navigate to="/error" />;
    if (allowedRole === "CUSTOMER" && effectiveRole !== "CUSTOMER")
      return <Navigate to="/error" />;
  }

  return children;
};

/**
 * The core router manager component.
 * Configures the Toast notification container, toggles the top navigation bar,
 * and declares all nested protected public and role-specific dashboard page routes.
 */
const RouterBody = () => {
  const location = useLocation();
  const isDeliverySection = [
    "/delivery-dashboard",
    "/assigned-orders",
    "/order-delivery",
    "/delivery-profile",
  ].some((p) => location.pathname.startsWith(p));

  return (
    <>
      <ToastContainer />
      {!isDeliverySection && <Navbar />}
      <ToastNotification />
      <Routes>
        <Route path="*" element={getDefaultRoute()} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/partner-with-us" element={<PartnerWithUs />} />
        <Route path="/become-rider" element={<BecomeRider />} />
        <Route path="/become-customer" element={<BecomeCustomer />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/error" element={<Error404 />} />

        <Route element={<ProtectedRoute allowedRole="CUSTOMER"><CustomerLayout /></ProtectedRoute>}>
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/restaurant/:id" element={<CustomerRestaurantDetail />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/order-tracking/:id" element={<CustomerOrderTracking />} />
          <Route path="/profile" element={<CustomerProfile />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="RESTAURANT_OWNER"><RestaurantLayout /></ProtectedRoute>}>
          <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
          <Route path="/menu-management" element={<RestaurantMenuManagement />} />
          <Route path="/restaurant-orders" element={<RestaurantOrders />} />
          <Route path="/restaurant-profile" element={<RestaurantProfile />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="DELIVERY_PARTNER"><DeliveryLayout /></ProtectedRoute>}>
          <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
          <Route path="/assigned-orders" element={<DeliveryAssignedOrders />} />
          <Route path="/order-delivery/:id" element={<DeliveryOrderDelivery />} />
          <Route path="/delivery-profile" element={<DeliveryProfile />} />
        </Route>
      </Routes>
    </>
  );
};

/**
 * The main React Application root component.
 * Provides the browser history context for the entire application.
 */
function App() {
  return (
    <BrowserRouter>
      <RouterBody />
    </BrowserRouter>
  );
}

export default App;
