import { Link } from "react-router-dom";

const RecentOrders = ({ orders = [] }) => {
  if (!orders.length) {
    return (
      <div className="bg-white/90 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Recent Orders</h3>
        <p className="text-sm text-gray-500">No recent orders to show (placeholder).</p>
        <div className="mt-3">
          <Link to="/restaurant-orders" className="text-sm text-blue-600">View all orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Recent Orders</h3>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="border-b pb-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Order #{o.id}</div>
                <div className="text-sm text-gray-500">{o.customerName} • {o.total}</div>
              </div>
              <div className="text-xs text-gray-400">{o.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentOrders;
