import { Link } from "react-router-dom";

const Error404 = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="text-8xl font-extrabold text-gray-200 mb-2 select-none">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
      <p className="text-gray-500 text-sm mb-6">
        The page you're looking for doesn't exist or you don't have permission to access it.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/welcome" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Go to Home
        </Link>
        <button onClick={() => window.history.back()} className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          Go Back
        </button>
      </div>
    </div>
  </div>
);

export default Error404;
