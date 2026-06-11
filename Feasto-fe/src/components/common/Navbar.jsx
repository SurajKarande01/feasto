import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
	const location = useLocation();
	
	// Don't show generic navbar on authenticated portal pages (they have their own TopNav)
	const hideOn = ['/customer-dashboard', '/restaurant-dashboard', '/delivery-dashboard', '/orders', '/profile', '/menu-management', '/restaurant-orders', '/restaurant-profile', '/assigned-orders', '/delivery-profile'];
	if (hideOn.some(p => location.pathname.startsWith(p))) return null;

	const hasCustomer = localStorage.getItem("customerProfile");
	const hasRestaurant = localStorage.getItem("restaurantProfile");
	const hasDelivery = localStorage.getItem("deliveryProfile");
	const token = localStorage.getItem("token");
	const isLoggedIn = !!token && (hasCustomer || hasRestaurant || hasDelivery);

	const getRedirectPath = () => {
		if (hasCustomer) return '/customer-dashboard';
		if (hasRestaurant) return '/restaurant-dashboard';
		if (hasDelivery) return '/delivery-dashboard';
		return '/become-customer';
	};

	const handleLogout = () => {
		localStorage.clear();
		window.location.href = "/welcome";
	};

	return (
		<nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-3.5 px-6 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<Link to="/" className="font-black text-slate-900 tracking-tight text-lg flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
					Feasto
				</Link>
				<div className="flex gap-4 items-center">
					<Link to="/welcome" className="text-xs font-bold text-slate-600 hover:text-rose-500 transition-colors">Home</Link>
					{isLoggedIn ? (
						<>
							<Link to={getRedirectPath()} className="text-xs font-bold text-slate-600 hover:text-rose-500 transition-colors">Dashboard</Link>
							<button onClick={handleLogout} className="text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98">Logout</button>
						</>
					) : (
						<>
							<Link to="/become-customer" className="text-xs font-bold text-slate-600 hover:text-rose-500 transition-colors">Login</Link>
							<Link to="/partner-with-us" className="text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98">Partner</Link>
						</>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
