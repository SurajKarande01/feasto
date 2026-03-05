import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function BecomeCustomer() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phoneNumber: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
    email: "",
    password: "",
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locError, setLocError] = useState("");

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((s) => ({ ...s, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((s) => ({ ...s, [name]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      return;
    }
    setLocError("");
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setRegisterForm((s) => ({ ...s, latitude, longitude }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const house = addr.house_number || addr.housenumber || "";
            const road =
              addr.road || addr.pedestrian || addr.cycleway || addr.footway || addr.neighbourhood || addr.suburb || "";
            const streetVal = (house ? house + " " : "") + (road || addr.street || "");

            setRegisterForm((s) => ({
              ...s,
              street: streetVal || s.street,
              city: addr.city || addr.town || addr.village || s.city,
              state: addr.state || s.state,
              postalCode: addr.postcode || s.postalCode,
              country: addr.country || s.country,
              latitude,
              longitude,
            }));
          }
        } catch (err) {
          console.error("reverse geocode failed", err);
        } finally {
          setLoadingLocation(false);
        }
      },
      (err) => {
        setLocError(err.message || "Unable to get location");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (isRegister && (!registerForm.latitude || !registerForm.longitude)) {
      handleGetLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegister]);

  const handleLoginSubmit = async () => {
    setApiError("");
    setApiLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/users/login",
        { email: loginForm.email, password: loginForm.password },
        { headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      try {
        if (data) localStorage.setItem("customerProfile", JSON.stringify(data));
      } catch (err) {
        console.warn("Failed to persist customer profile", err);
      }
      navigate("/customer-dashboard");
    } catch (err) {
      const msg = err?.request?.responseText || err.message || "Login failed";
      setApiError(msg);
    } finally {
      setApiLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    setApiError("");
    setApiLoading(true);
    const payload = {
      name: registerForm.name,
      phoneNumber: registerForm.phoneNumber,
      address: {
        street: registerForm.street,
        city: registerForm.city,
        state: registerForm.state,
        postalCode: registerForm.postalCode,
        country: registerForm.country,
        latitude: registerForm.latitude ? parseFloat(registerForm.latitude) : null,
        longitude: registerForm.longitude ? parseFloat(registerForm.longitude) : null,
      },
      email: registerForm.email,
      password: registerForm.password,
    };
    try {
      await axios.post(
        "http://localhost:8080/api/users/register",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      alert("Registration successful — you can now login");
      setIsRegister(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Registration failed";
      setApiError(msg);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mx-auto bg-white/95 rounded-lg p-6 shadow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Become a Customer</h1>
            <p className="text-gray-700 mb-6">
              Create an account or login to start ordering from your favourite restaurants.
            </p>
            <ul className="list-disc pl-5 mb-6 text-gray-700">
              <li>Discover restaurants near you</li>
              <li>Track orders in real-time</li>
              <li>Access exclusive offers</li>
            </ul>
          </div>

          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Get started</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setApiError(""); setIsRegister(false); }}
                    className={`px-3 py-2 rounded ${!isRegister ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setApiError(""); setIsRegister(true); }}
                    className={`px-3 py-2 rounded ${isRegister ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Login */}
              <div style={{ display: isRegister ? "none" : "block" }}>
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <input
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    placeholder="Email"
                    className="w-full p-3 rounded border"
                  />
                  <input
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Password"
                    type="password"
                    className="w-full p-3 rounded border"
                  />
                </div>
                {apiError && <div className="text-sm text-red-500 mb-2">{apiError}</div>}
                <button
                  onClick={handleLoginSubmit}
                  disabled={apiLoading}
                  className="w-full bg-green-600 text-white p-3 rounded"
                >
                  {apiLoading ? "Logging in…" : "Login"}
                </button>
              </div>

              {/* Register */}
              <div style={{ display: isRegister ? "block" : "none" }}>
                <div className="mb-4 text-sm font-semibold text-gray-700">Personal details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <input
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    placeholder="Full name"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="phoneNumber"
                    value={registerForm.phoneNumber}
                    onChange={handleRegisterChange}
                    placeholder="Phone number"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="Email"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="Password"
                    type="password"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-2 text-sm font-semibold text-gray-700">Address</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <input
                    name="postalCode"
                    value={registerForm.postalCode}
                    onChange={handleRegisterChange}
                    placeholder="Postal code"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="street"
                    value={registerForm.street}
                    onChange={handleRegisterChange}
                    placeholder="Street"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="city"
                    value={registerForm.city}
                    onChange={handleRegisterChange}
                    placeholder="City"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="state"
                    value={registerForm.state}
                    onChange={handleRegisterChange}
                    placeholder="State"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    name="country"
                    value={registerForm.country}
                    onChange={handleRegisterChange}
                    placeholder="Country"
                    className="w-full p-3 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mt-1 text-sm text-gray-600 mb-3">
                  {loadingLocation ? (
                    <span>Detecting location...</span>
                  ) : locError ? (
                    <span className="text-red-500">{locError}</span>
                  ) : (
                    <span>Location detected</span>
                  )}
                  <span className="ml-2 inline-block">
                  Latitude: {registerForm.latitude || "—"} &nbsp; Longitude: {registerForm.longitude || "—"}
                  </span>
                </div>
                {apiError && <div className="text-sm text-red-500 mb-2">{apiError}</div>}
                <button
                  onClick={handleRegisterSubmit}
                  disabled={apiLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded shadow"
                >
                  {apiLoading ? "Registering…" : "Register"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BecomeCustomer;
