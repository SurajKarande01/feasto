import { Link } from 'react-router-dom';

const DashboardHeader = ({ name, address, phone }) => {
  return (
    <div className="bg-white/90 rounded-lg shadow p-4 flex items-center justify-between w-full">
      <div>
        <div className="text-lg font-semibold">{name}</div>
        <div className="text-sm text-gray-500">{address}</div>
        <div className="text-sm text-gray-500">{phone}</div>
      </div>
      <div className="hidden sm:flex gap-3">
        <Link to="/menu-management" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Manage Menu</Link>
        <Link to="/restaurant-orders" className="px-3 py-2 border rounded text-sm">View Orders</Link>
      </div>
    </div>
  );
};

export default DashboardHeader;
