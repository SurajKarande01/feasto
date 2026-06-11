import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRestaurant, registerRestaurant } from "../../services/api/authService";

const cuisineOptions = [
  "Punjabi",
  "North Indian",
  "South Indian",
  "Chinese",
  "Italian",
  "Continental",
  "Fast Food",
  "Street Food",
  "Desserts",
  "Seafood",
  "Thai",
  "Mexican",
  "Japanese",
  "Mughlai",
  "Lebanese",
];

export default function PartnerWithUs() {
  const navigate = useNavigate();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    description: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
    phoneNumber: "",
    cuisineType: "",
    email: "",
    password: "",
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locError, setLocError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

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
              addr.road ||
              addr.pedestrian ||
              addr.cycleway ||
              addr.footway ||
              addr.neighbourhood ||
              addr.suburb ||
              "";
            const streetVal =
              (house ? house + " " : "") + (road || addr.street || "");

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
      await loginRestaurant({ email: loginForm.email, password: loginForm.password });
      navigate("/restaurant-dashboard");
    } catch (err) {
      console.error("Login error", err);
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
      description: registerForm.description,
      address: {
        street: registerForm.street,
        city: registerForm.city,
        state: registerForm.state,
        postalCode: registerForm.postalCode,
        country: registerForm.country,
        latitude: registerForm.latitude
          ? parseFloat(registerForm.latitude)
          : null,
        longitude: registerForm.longitude
          ? parseFloat(registerForm.longitude)
          : null,
      },
      phoneNumber: registerForm.phoneNumber,
      cuisineType: registerForm.cuisineType,
      email: registerForm.email,
      password: registerForm.password,
    };

    const formData = new FormData();
    formData.append(
      "restaurant",
      JSON.stringify(payload)
    );
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      await registerRestaurant(formData);
      alert("Registration successful — you can now login");
      setIsRegister(false);
    } catch (err) {
      console.error("Registration error", err);
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
              Restaurant Partner
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Partner with Feasto
            </h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm">
              Unlock a new revenue stream. List your menu, receive orders online, manage deliveries seamlessly, and get analytical breakdowns.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Massive Customer Reach</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Get discovered by thousands of hungry customers in your city.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Advanced Analytics Dashboard</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Track daily sales, order history, and dish demand metrics easily.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Reliable Logistics Integration</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Leverage our professional rider network for quick deliveries.</p>
                </div>
              </div>
            </div>

            {imagePreviewUrl && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 max-w-sm">
                <img
                  src={imagePreviewUrl}
                  alt="Restaurant Preview"
                  className="w-16 h-16 object-cover rounded-xl shadow-inner shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{registerForm.name || "Restaurant Name"}</p>
                  <p className="text-[10px] font-medium text-slate-400 truncate">{registerForm.cuisineType || "Cuisine"}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Get in touch</h2>
                <div className="flex bg-slate-200/50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setApiError("");
                      setIsRegister(false);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                      !isRegister ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApiError("");
                      setIsRegister(true);
                    }}
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
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Merchant Details</div>
                  <div className="space-y-3">
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
                    <input
                      name="name"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      required
                      placeholder="Restaurant Name"
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
                    <div>
                      <input
                        list="cuisines"
                        name="cuisineType"
                        value={registerForm.cuisineType}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Cuisine (start typing or select)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                      <datalist id="cuisines">
                        {cuisineOptions.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                    <input
                      name="postalCode"
                      value={registerForm.postalCode}
                      onChange={handleRegisterChange}
                      required
                      placeholder="Postal Code"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <textarea
                      name="description"
                      value={registerForm.description}
                      onChange={handleRegisterChange}
                      placeholder="Short business description..."
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm shadow-none"
                    />
                  </div>

                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Location Address</div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        name="street"
                        value={registerForm.street}
                        onChange={handleRegisterChange}
                        required
                        placeholder="Street / Locality"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                      <input
                        name="city"
                        value={registerForm.city}
                        onChange={handleRegisterChange}
                        required
                        placeholder="City"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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

                  <div className="bg-slate-100/80 p-3.5 rounded-xl text-xs text-slate-600 space-y-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Kitchen Coordinates</span>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                      >
                        Locate Kitchen
                      </button>
                    </div>
                    {loadingLocation ? (
                      <p className="text-[11px] text-rose-500 animate-pulse">Detecting GPS coordinates...</p>
                    ) : locError ? (
                      <p className="text-[11px] text-rose-500">{locError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        GPS Coordinates: {registerForm.latitude && registerForm.longitude ? `${registerForm.latitude}, ${registerForm.longitude}` : "Not Set"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Restaurant Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setImageFile(
                          e.target.files && e.target.files[0]
                            ? e.target.files[0]
                            : null
                        )
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
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
                    {apiLoading ? "Registering Partner…" : "Register Partner"}
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
