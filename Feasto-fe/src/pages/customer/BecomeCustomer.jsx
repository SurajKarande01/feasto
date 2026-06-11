import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../services/api/authService";

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
    const token = localStorage.getItem("token");
    if (token) {
      if (localStorage.getItem("customerProfile")) {
        navigate("/customer-dashboard");
      } else if (localStorage.getItem("restaurantProfile")) {
        navigate("/restaurant-dashboard");
      } else if (localStorage.getItem("deliveryProfile")) {
        navigate("/delivery-dashboard");
      }
    }
  }, [navigate]);

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
      await loginUser({ email: loginForm.email, password: loginForm.password });
      navigate("/customer-dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Login failed";
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
      await registerUser(payload);
      alert("Registration successful — you can now login");
      setIsRegister(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Registration failed";
      setApiError(msg);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/80 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-md border border-slate-100 rounded-[32px] shadow-xl overflow-hidden p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-3.5 py-2 rounded-full inline-block mb-4">
              Customer Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Join the Feasto Family
            </h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm">
              Create an account or login to start ordering gourmet meals from your favorite neighborhood kitchens.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Discover premium kitchens</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Access a curated selection of verified local restaurants.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Real-time GPS tracking</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Monitor your delivery rider live from the kitchen to your doorstep.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Exclusive loyalty offers</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Unlock discounts, free items, and Feasto Gold membership rewards.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Get started</h2>
                <div className="flex bg-slate-200/50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setApiError(""); setIsRegister(false); }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                      !isRegister ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setApiError(""); setIsRegister(true); }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                      isRegister ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Login Form */}
              {!isRegister ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLoginSubmit();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <input
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="Email Address"
                      type="email"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <input
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="Password"
                      type="password"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                  </div>
                  {apiError && (
                    <div className="text-xs font-semibold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                      {apiError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={apiLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
                  >
                    {apiLoading ? "Signing In…" : "Sign In"}
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegisterSubmit();
                  }}
                  className="space-y-4 max-h-[50vh] overflow-y-auto pr-1"
                >
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Details</div>
                  <div className="space-y-3">
                    <input
                      name="name"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      required
                      placeholder="Full Name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                    <input
                      name="phoneNumber"
                      value={registerForm.phoneNumber}
                      onChange={handleRegisterChange}
                      required
                      placeholder="Phone Number"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                    <input
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      type="email"
                      required
                      placeholder="Email Address"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                    <input
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder="Password"
                      type="password"
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                  </div>

                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Delivery Address</div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="postalCode"
                        value={registerForm.postalCode}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Postal Code"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                      <input
                        name="street"
                        value={registerForm.street}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Street"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        name="city"
                        value={registerForm.city}
                        onChange={handleRegisterChange}
                        required
                        placeholder="City"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                      <input
                        name="state"
                        value={registerForm.state}
                        onChange={handleRegisterChange}
                        required
                        placeholder="State"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                      <input
                        name="country"
                        value={registerForm.country}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Country"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-100/80 p-3.5 rounded-xl text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Geolocation Detection</span>
                      {loadingLocation ? (
                        <span className="text-rose-500 animate-pulse">Detecting...</span>
                      ) : locError ? (
                        <span className="text-rose-500">Failed</span>
                      ) : (
                        <span className="text-emerald-600">Detected</span>
                      )}
                    </div>
                    {locError ? (
                      <p className="text-[11px] text-rose-500">{locError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Lat: {registerForm.latitude || "—"} &nbsp; Lng: {registerForm.longitude || "—"}
                      </p>
                    )}
                  </div>

                  {apiError && (
                    <div className="text-xs font-semibold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                      {apiError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={apiLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer"
                  >
                    {apiLoading ? "Creating Account…" : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BecomeCustomer;
