import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
	const location = useLocation();
	
	// Don't show generic navbar on authenticated portal pages (they have their own TopNav)
	const hideOn = ['/customer-dashboard', '/restaurant-dashboard', '/delivery-dashboard', '/orders', '/profile', '/menu-management', '/restaurant-orders', '/restaurant-profile', '/assigned-orders', '/delivery-profile'];
	if (hideOn.some(p => location.pathname.startsWith(p))) return null;

	return (
		<nav className="bg-white shadow p-4">
			<div className="container mx-auto flex items-center justify-between">
				<Link to="/" className="font-bold text-xl">Feasto</Link>
				<div className="flex gap-3">
					<Link to="/welcome" className="text-sm hover:underline">Home</Link>
					<Link to="/become-customer" className="text-sm hover:underline">Login</Link>
					<Link to="/partner-with-us" className="text-sm hover:underline">Partner</Link>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
