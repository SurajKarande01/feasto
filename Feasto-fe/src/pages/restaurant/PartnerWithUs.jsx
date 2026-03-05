import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PartnerWithUs.css";

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
    if (isRegister && (!registerForm.latitude || !registerForm.longitude)) {
      handleGetLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegister]);

  // --- API handlers using axios (keeps onClick clean) ---
  const handleLoginSubmit = async () => {
    setApiError("");
    setApiLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/restaurants/login",
        { email: loginForm.email, password: loginForm.password },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data) {
        localStorage.setItem("restaurantProfile", JSON.stringify(res.data));
      }
      navigate("/restaurant-dashboard");
    } catch (err) {
      console.error("Login error", err);
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
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      await axios.post(
        "http://localhost:8080/api/restaurants/register",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Registration successful — you can now login");
      setIsRegister(false);
    } catch (err) {
      console.error("Registration error", err);
      const msg =
        err?.response?.data?.message || err.message || "Registration failed";
      setApiError(msg);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 partner-hero">
      <div className="mx-auto partner-card bg-white/95 rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">Partner with Feasto</h1>
            <p className="text-gray-700 mb-6">
              Grow your business by joining our food delivery platform. Reach
              more customers, get detailed analytics and seamless order
              management.
            </p>

            <ul className="list-disc pl-5 mb-6 text-gray-700">
              <li>Access to a large customer base</li>
              <li>Order management tools and analytics</li>
              <li>Marketing and promotional support</li>
            </ul>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">What we provide</h3>
                <p className="text-sm text-gray-600">
                  Quick onboarding, payments, partner support and optional
                  delivery fulfillment.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Who can join</h3>
                <p className="text-sm text-gray-600">
                  Existing restaurants, cloud kitchens and food vendors looking
                  to expand their reach.
                </p>
              </div>
            </div>

            {/* Image Preview Here */}
            <div className="flex justify-center items-center">
              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Restaurant"
                  className="w-48 h-48 object-cover rounded"
                />
              )}
            </div>
          </div>

          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Get in touch</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApiError("");
                      setIsRegister(false);
                    }}
                    className={`px-3 py-2 rounded ${
                      !isRegister ? "bg-blue-600 text-white" : "bg-gray-200"
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
                    className={`px-3 py-2 rounded ${
                      isRegister ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
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
                    className="w-full p-3 rounded"
                  />
                  <input
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Password"
                    type="password"
                    className="w-full p-3 rounded"
                  />
                </div>

                {apiError && (
                  <div className="text-sm text-red-500 mb-2">{apiError}</div>
                )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="Email"
                    className="w-full p-3 rounded"
                  />
                  <input
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="Password"
                    type="password"
                    className="w-full p-3 rounded"
                  />
                  <input
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    placeholder="Restaurant name"
                    className="w-full p-3 rounded"
                  />
                  <input
                    name="phoneNumber"
                    value={registerForm.phoneNumber}
                    onChange={handleRegisterChange}
                    placeholder="Phone number"
                    className="w-full p-3 rounded"
                  />

                  <div>
                    <input
                      list="cuisines"
                      name="cuisineType"
                      value={registerForm.cuisineType}
                      onChange={handleRegisterChange}
                      placeholder="Cuisine (start typing or pick)"
                      className="w-full p-3 rounded"
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
                    placeholder="Postal code"
                    className="w-full p-3 rounded"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <textarea
                    name="description"
                    value={registerForm.description}
                    onChange={handleRegisterChange}
                    placeholder="Short description"
                    rows={3}
                    className="w-full p-3 rounded"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="street"
                    value={registerForm.street}
                    onChange={handleRegisterChange}
                    placeholder="Street"
                    className="w-full p-3 rounded"
                  />
                  <input
                    name="city"
                    value={registerForm.city}
                    onChange={handleRegisterChange}
                    placeholder="City"
                    className="w-full p-3 rounded"
                  />
                  <input
                    name="state"
                    value={registerForm.state}
                    onChange={handleRegisterChange}
                    placeholder="State"
                    className="w-full p-3 rounded"
                  />
                  <input
                    name="country"
                    value={registerForm.country}
                    onChange={handleRegisterChange}
                    placeholder="Country"
                    className="w-full p-3 rounded"
                  />
                </div>

                <div className="mt-4 flex gap-3 items-center">
                  {loadingLocation ? (
                    <div className="text-sm text-gray-600">
                      Detecting location...
                    </div>
                  ) : locError ? (
                    <div className="text-sm text-red-500">{locError}</div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Location detected
                    </div>
                  )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Latitude: {registerForm.latitude || "—"} &nbsp; Longitude:{" "}
                  {registerForm.longitude || "—"}
                </div>

                <div className="mt-3">
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
                    className="w-full p-2 rounded border"
                  />
                </div>
                {imagePreviewUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="text-sm text-gray-700 line-clamp-2">
                      {imageFile?.name}
                    </div>
                    <button
                      type="button"
                      className="ml-auto text-xs px-2 py-1 rounded border"
                      onClick={() => setImageFile(null)}
                    >
                      Clear
                    </button>
                  </div>
                )}

                {apiError && (
                  <div className="text-sm text-red-500 mb-2">{apiError}</div>
                )}

                <div className="mt-2">
                  <button
                    onClick={handleRegisterSubmit}
                    disabled={apiLoading}
                    className="w-full bg-blue-600 text-white p-3 rounded"
                  >
                    {apiLoading ? "Registering…" : "Register"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
