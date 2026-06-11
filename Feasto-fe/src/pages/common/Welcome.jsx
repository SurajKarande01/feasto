import { Link, useNavigate } from 'react-router-dom';
import bgVideo from '../../assets/videos/add.mp4';
import '../../index.css';


const Hero = ({ onOrder, onBrowse, onCustomer, onPartner, onRider, isLoggedIn, onGoToDashboard, onLogout }) => (
  <section className="relative overflow-hidden text-white min-h-[75vh] flex items-center justify-center py-20 bg-slate-950">
    {/* Background video */}
    <video src={bgVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
    {/* Overlay to improve readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/45 to-slate-950/80 z-10" />
    <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 relative z-20">
      <div className="lg:w-7/12 text-center lg:text-left">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-3.5 py-2 rounded-full inline-block mb-4">
          Feasto Delivery Network
        </span>
        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
          India's premium <span className="text-rose-500">food delivery</span> platform
        </h1>
        <p className="text-base md:text-lg text-slate-300 max-w-xl mb-8 leading-relaxed">
          Order from top-tier neighborhood kitchens, track in real-time, and experience lightning-fast delivery.
        </p>

        <div className="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2">
          <input 
            id="hero-search" 
            placeholder="Search restaurants, cuisines..." 
            className="flex-1 px-4 py-3 bg-white/10 border-0 text-white placeholder-slate-400 focus:ring-0 rounded-xl text-sm" 
          />
          <div className="flex gap-2 shrink-0">
            <button onClick={onBrowse} className="border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer">
              Browse
            </button>
            <button onClick={onOrder} className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all duration-200 cursor-pointer">
              Order Now
            </button>
          </div>
        </div>
      </div>

      <div className="lg:w-5/12 w-full max-w-sm">
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl text-white">
          {isLoggedIn ? (
            <>
              <h3 className="text-xl font-bold tracking-tight mb-2">Welcome Back!</h3>
              <p className="text-xs text-slate-300 mb-6 font-medium">You are currently logged in. Access your dashboard or manage your account.</p>
              <div className="grid gap-3">
                <button onClick={onGoToDashboard} className="w-full text-center bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(255,56,92,0.3)] cursor-pointer">
                  Go to Dashboard
                </button>
                <button onClick={onLogout} className="w-full text-center bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold tracking-tight mb-2">Explore Opportunities</h3>
              <p className="text-xs text-slate-300 mb-6 font-medium">Join Feasto as a merchant, partner, or delivery champion.</p>
              <div className="grid gap-3">
                <button onClick={onCustomer} className="w-full text-center bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer">
                  Sign In as Customer
                </button>
                <button onClick={onPartner} className="w-full text-center bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer">
                  Partner Your Restaurant
                </button>
                <button onClick={onRider} className="w-full text-center bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(255,56,92,0.3)] cursor-pointer">
                  Join as a Delivery Rider
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </section>
);

const Stat = ({ value, label }) => (
  <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
    <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">{value}</div>
    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
  </div>
);

const Stats = () => (
  <section className="py-12 bg-white border-b border-slate-100">
    <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
      <Stat value="300,000+" label="Culinary Partners" />
      <Stat value="800+" label="Active Cities" />
      <Stat value="3 Billion+" label="Meals Delivered" />
    </div>
  </section>
);

const Feature = ({ icon, title }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white border border-slate-50 rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300">
    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
      {icon}
    </div>
    <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{title}</div>
  </div>
);

const Features = () => {
  const items = ['Veg Mode','Healthy','Collections','Schedule Order','Plan a Party','Offers','Food on Train','Gourmet','Gift Cards'];

  const iconFor = (name) => {
    switch (name) {
      case 'Veg Mode':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 14c6 0 10-4 10-10 0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'Healthy':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.76 5.64a3.5 3.5 0 0 1 4.95 4.95L12 16.3l-5.71-5.71a3.5 3.5 0 1 1 4.95-4.95l.76.76.76-.76z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        );
      case 'Collections':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
      case 'Schedule Order':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'Plan a Party':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 18l6-12 10 10-12 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 4l2 2M18 6l2 1M16 8l1 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case 'Offers':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12l9-9 9 9-9 9-9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 12l6-6M9.5 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7-7a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case 'Food on Train':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="6" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 17l-2 2M17 17l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="9" cy="17" r="1" fill="currentColor"/>
            <circle cx="15" cy="17" r="1" fill="currentColor"/>
          </svg>
        );
      case 'Gourmet':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 11c0-3.314 2.686-6 6-6s6 2.686 6 6H6z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 11h14v2a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-2z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
      case 'Gift Cards':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 12h18M9 7c0 2 2 3 3 3s3-1 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
    }
  };

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-6">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-500 mb-2 inline-block">App Capabilities</span>
        <h2 className="text-3xl font-black text-slate-900 mb-8">Features & Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-4">
          {items.map((it) => (
            <Feature key={it} title={it} icon={iconFor(it)} />
          ))}
        </div>
      </div>
    </section>
  );
};

const GoldBenefits = () => (
  <section className="py-16 bg-white">
    <div className="container mx-auto px-6 max-w-4xl">
      <div className="bg-amber-50/70 border border-amber-200/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_30px_rgba(245,158,11,0.03)]">
        <div className="flex-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-100/60 px-3 py-1.5 rounded-full inline-block mb-3">Premium tier</span>
          <h3 className="text-2xl font-black text-amber-900">Feasto Gold Club</h3>
          <p className="text-sm text-amber-700/80 mt-1 leading-relaxed">Unlock free delivery on selected orders and up to <span className="font-extrabold text-amber-900">30% discount</span> across participating premium kitchens.</p>
        </div>
        <div>
          <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer">
            Explore Gold
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Services = () => {
  const services = [
    { name: 'Feasto Delivery', desc: 'Gourmet meal ordering' },
    { name: 'Feasto Instamart', desc: 'Instant grocery delivery' },
    { name: 'Feasto Events', desc: 'Local dining & concert passes' },
    { name: 'Feasto Supply', desc: 'B2B kitchen supplies' },
  ];
  return (
    <section className="py-16 bg-slate-50/50 border-t border-slate-100">
      <div className="container mx-auto px-6">
        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-500 mb-2 inline-block">Feasto Ecosystem</span>
        <h2 className="text-3xl font-black text-slate-900 mb-8">Redefining Urban Convenience</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {services.map(s => (
            <div key={s.name} className="p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:translate-y-[-1px] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="text-lg font-bold text-slate-950 mb-1">{s.name}</div>
                <div className="text-xs font-medium text-slate-500 mb-6">{s.desc}</div>
              </div>
              <button className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors text-left flex items-center gap-1 cursor-pointer">
                Explore service →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-slate-950 text-slate-400 py-16">
    <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
      <div>
        <div className="text-white font-extrabold text-sm uppercase tracking-wider mb-4">Feasto Group</div>
        <ul className="text-xs space-y-2.5 font-medium">
          <li><a href="#" className="hover:text-white transition-colors">Eternal Corp</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Feasto Food</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Instamart</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Hyperpure Supplies</a></li>
        </ul>
      </div>
      <div>
        <div className="text-white font-extrabold text-sm uppercase tracking-wider mb-4">For Partners</div>
        <ul className="text-xs space-y-2.5 font-medium">
          <li><Link to="/partner-with-us" className="hover:text-white transition-colors">Restaurant Portal</Link></li>
          <li><Link to="/become-rider" className="hover:text-white transition-colors">Rider Dashboard</Link></li>
          <li><a href="#" className="hover:text-white transition-colors">Merchant Help</a></li>
        </ul>
      </div>
      <div>
        <div className="text-white font-extrabold text-sm uppercase tracking-wider mb-4">Company</div>
        <ul className="text-xs space-y-2.5 font-medium">
          <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Official Blog</a></li>
        </ul>
      </div>
      <div>
        <div className="text-white font-extrabold text-sm uppercase tracking-wider mb-4">Legal</div>
        <ul className="text-xs space-y-2.5 font-medium">
          <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Rider Terms</a></li>
        </ul>
      </div>
    </div>
    <div className="container mx-auto px-6 border-t border-slate-900/60 mt-12 pt-8 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
      <span>© {new Date().getFullYear()} Feasto Technologies Ltd. All rights reserved.</span>
      <div className="flex gap-4">
        <a href="#" className="hover:text-white transition-colors">Twitter</a>
        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
        <a href="#" className="hover:text-white transition-colors">Instagram</a>
      </div>
    </div>
  </footer>
);

export default function Welcome() {
  const navigate = useNavigate();

  const customer = localStorage.getItem("customerProfile");
  const restaurant = localStorage.getItem("restaurantProfile");
  const delivery = localStorage.getItem("deliveryProfile");
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token && (customer || restaurant || delivery);

  const getRedirectPath = () => {
    if (customer) return '/customer-dashboard';
    if (restaurant) return '/restaurant-dashboard';
    if (delivery) return '/delivery-dashboard';
    return '/become-customer';
  };

  const onOrder = () => navigate(getRedirectPath());
  const onBrowse = () => navigate(getRedirectPath());
  const onPartner = () => navigate('/partner-with-us');
  const onRider = () => navigate('/become-rider');
  const onCustomer = () => navigate('/become-customer');

  const onGoToDashboard = () => navigate(getRedirectPath());
  const onLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 animate-fade-in">
      <Hero 
        onOrder={onOrder} 
        onBrowse={onBrowse} 
        onCustomer={onCustomer} 
        onPartner={onPartner} 
        onRider={onRider} 
        isLoggedIn={isLoggedIn}
        onGoToDashboard={onGoToDashboard}
        onLogout={onLogout}
      />
      <Stats />
      <Features />
      <GoldBenefits />
      <Services />

      {!isLoggedIn && (
        <div className="bg-slate-50/50 border-t border-b border-slate-100 py-16 text-center">
          <h3 className="text-2xl font-black text-slate-900 mb-2">Ready to embark on a flavor journey?</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Create a free account or login to access hundreds of premium restaurants.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/partner-with-us')} className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs px-6 py-3 rounded-xl transition-all duration-200 shadow-sm inline-flex items-center justify-center cursor-pointer">Partner With Us</button>
            <button onClick={() => navigate('/become-rider')} className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs px-6 py-3 rounded-xl transition-all duration-200 shadow-sm inline-flex items-center justify-center cursor-pointer">Become a Rider</button>
            <button onClick={() => navigate('/become-customer')} className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/20 inline-flex items-center justify-center cursor-pointer">Customer Portal</button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}