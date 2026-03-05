import { Link } from 'react-router-dom';

const Navbar = () => {
	return (
		<nav className="bg-white shadow p-4">
			<div className="container mx-auto flex items-center justify-between">
				<Link to="/" className="font-bold text-xl">Feasto</Link>
				<div className="flex gap-3">
					<Link to="/" className="text-sm">Home</Link>
					<Link to="/cart" className="text-sm">Cart</Link>
					<Link to="/profile" className="text-sm">Profile</Link>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;

 
