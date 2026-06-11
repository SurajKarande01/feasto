import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginDeliveryPartner, registerDeliveryPartner } from '../../services/api/authService';

const BecomeRider = () => {
  const navigate = useNavigate();

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

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    vehicleDetails: '',
    available: true,
    email: '',
    password: '',
    latitude: '',
    longitude: ''
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locError, setLocError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((s) => ({ ...s, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiLoading(true);
    try {
      const payload = {
        name: form.name,
        phoneNumber: form.phoneNumber,
        vehicleDetails: form.vehicleDetails,
        available: Boolean(form.available),
        currentLocation: {
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        },
        email: form.email,
        password: form.password,
      };

      await registerDeliveryPartner(payload);

      alert('Registration successful — you can now login');
      setForm({
        name: '',
        phoneNumber: '',
        vehicleDetails: '',
        available: true,
        email: '',
        password: '',
        latitude: '',
        longitude: ''
      });
      setIsRegister(false);
    } catch (err) {
      console.error('Rider registration error', err);
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      setApiError(msg);
    } finally {
      setApiLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser');
      return;
    }
    setLocError('');
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((s) => ({ ...s, latitude, longitude }));
        setLoadingLocation(false);
      },
      (err) => {
        setLocError(err.message || 'Unable to get location');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLoginSubmit = async () => {
    setApiError('');
    setApiLoading(true);
    try {
      await loginDeliveryPartner({ email: loginForm.email, password: loginForm.password });
      navigate('/delivery-dashboard');
    } catch (err) {
      console.error('Login error', err);
      const msg = err.response?.data?.error || err.message || 'Login failed';
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
              Rider Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Deliver & Earn with Feasto
            </h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm">
              Become a Delivery Partner. Work flexible hours, receive competitive payouts, and enjoy premium onboarding support.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Flexible Schedule</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Toggle your availability anytime. Be your own boss.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Competitive Earnings</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Prompt payouts with additional tips and mileage incentives.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Quick Onboarding</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Submit your vehicle details, activate GPS, and start delivering.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Get in touch</h2>
                <div className="flex bg-slate-200/50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setApiError(''); setIsRegister(false); }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                      !isRegister ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setApiError(''); setIsRegister(true); }}
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
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="Email Address"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="Password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Full Name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                    <input
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      required
                      placeholder="Phone Number"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                    <input
                      name="vehicleDetails"
                      value={form.vehicleDetails}
                      onChange={handleChange}
                      required
                      placeholder="Vehicle details (e.g. Bike, Scooter model)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 px-1">
                    <input
                      id="available"
                      type="checkbox"
                      checked={!!form.available}
                      onChange={(e) => setForm((s) => ({ ...s, available: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                    />
                    <label htmlFor="available" className="text-xs font-semibold text-slate-700">
                      Available for deliveries immediately
                    </label>
                  </div>

                  <div className="bg-slate-100/80 p-3.5 rounded-xl text-xs text-slate-600 space-y-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Rider Geolocation</span>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                      >
                        Locate Me
                      </button>
                    </div>
                    {loadingLocation ? (
                      <p className="text-[11px] text-rose-500 animate-pulse">Detecting GPS coordinates...</p>
                    ) : locError ? (
                      <p className="text-[11px] text-rose-500">{locError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        GPS Location: {form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : "Not Set"}
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
};

export default BecomeRider;
