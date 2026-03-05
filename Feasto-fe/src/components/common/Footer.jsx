import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-black/10 bg-white/70 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
        <div>
          <div className="font-semibold">Feasto</div>
          <div className="text-gray-600">Delicious food delivered to you.</div>
        </div>
        <div className="flex gap-4">
          <Link to="/customer-dashboard" className="hover:underline">Home</Link>
          <Link to="/orders" className="hover:underline">Orders</Link>
          <Link to="/cart" className="hover:underline">Cart</Link>
          <Link to="/profile" className="hover:underline">Profile</Link>
        </div>
        <div className="text-right md:text-right text-gray-600">© {year} Feasto</div>
      </div>
    </footer>
  );
};

export default Footer;
