import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BecomeRider.css';

const BecomeRider = () => {
  const navigate = useNavigate();
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

      await axios.post(
        'http://localhost:8080/api/delivery-partners/register',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

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
      const msg = err?.response?.data?.message || err.message || 'Registration failed';
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
      // TODO: confirm login endpoint path with backend
      const res = await axios.post(
        'http://localhost:8080/api/delivery-partners/login',
        { email: loginForm.email, password: loginForm.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.data) {
        localStorage.setItem('deliveryProfile', JSON.stringify(res.data));
      }
      navigate('/delivery-dashboard');
    } catch (err) {
      console.error('Login error', err);
      const msg = err?.request?.responseText || err.message || 'Login failed';
      setApiError(msg);
    } finally {
      setApiLoading(false);
    }
  };

  return (
  <div className="container mx-auto p-6 become-rider-hero">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl font-bold mb-4">Become a Delivery Partner</h1>
          <p className="text-gray-700 mb-6">Join our delivery network and earn by delivering food in your city. Flexible hours, prompt payouts and dedicated support.</p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">●</span>
              <div>
                <div className="font-semibold">Flexible schedule</div>
                <div className="text-sm text-gray-600">You choose when you want to work.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">●</span>
              <div>
                <div className="font-semibold">Competitive earnings</div>
                <div className="text-sm text-gray-600">Daily payouts and incentives for high performers.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">●</span>
              <div>
                <div className="font-semibold">Support & onboarding</div>
                <div className="text-sm text-gray-600">Quick onboarding and help whenever you need it.</div>
              </div>
            </li>
          </ul>

          <div className="text-sm text-gray-600">Ready to get started? Fill the form and we'll be in touch within 24 hours.</div>
        </div>

        <div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Get in touch</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setApiError(''); setIsRegister(false); }}
                  className={`px-3 py-2 rounded ${!isRegister ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setApiError(''); setIsRegister(true); }}
                  className={`px-3 py-2 rounded ${isRegister ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Login */}
            <div style={{ display: isRegister ? 'none' : 'block' }}>
              <div className="grid grid-cols-1 gap-3 mb-3">
                <input name="email" value={loginForm.email} onChange={handleLoginChange} placeholder="Email" className="w-full p-3 rounded" />
                <input name="password" type="password" value={loginForm.password} onChange={handleLoginChange} placeholder="Password" className="w-full p-3 rounded" />
              </div>
              {apiError && <div className="text-sm text-red-500 mb-2">{apiError}</div>}
              <button onClick={handleLoginSubmit} disabled={apiLoading} className="w-full bg-green-600 text-white p-3 rounded">
                {apiLoading ? 'Logging in…' : 'Login'}
              </button>
            </div>

            {/* Register */}
            <div style={{ display: isRegister ? 'block' : 'none' }}>
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <input name="email" value={form.email} onChange={handleChange} required placeholder="Email" className="w-full border p-2 rounded" />
                <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Password" className="w-full border p-2 rounded" />
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Full name" className="w-full border p-2 rounded" />
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required placeholder="Phone number" className="w-full border p-2 rounded" />
                <input name="vehicleDetails" value={form.vehicleDetails} onChange={handleChange} required placeholder="Vehicle details (e.g. Bike/Scooter + Model)" className="w-full border p-2 rounded" />

                <div className="flex items-center gap-2">
                  <input id="available" type="checkbox" checked={!!form.available} onChange={(e) => setForm((s) => ({ ...s, available: e.target.checked }))} className="h-4 w-4" />
                  <label htmlFor="available" className="text-sm text-gray-700">Available for deliveries</label>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-3 items-center">
                    <button type="button" onClick={handleGetLocation} className="px-3 py-2 rounded bg-gray-100 border">Use current location</button>
                    {loadingLocation ? (
                      <div className="text-sm text-gray-600">Detecting location...</div>
                    ) : locError ? (
                      <div className="text-sm text-red-500">{locError}</div>
                    ) : (
                      <div className="text-sm text-gray-600">Location {form.latitude && form.longitude ? 'detected' : 'not set'}</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Latitude: {form.latitude || '—'} &nbsp; Longitude: {form.longitude || '—'}
                  </div>
                </div>

                {apiError && <div className="text-sm text-red-500 mb-2">{apiError}</div>}

                <button type="submit" disabled={apiLoading} className="w-full bg-blue-600 text-white p-3 rounded">
                  {apiLoading ? 'Registering…' : 'Register'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeRider;
