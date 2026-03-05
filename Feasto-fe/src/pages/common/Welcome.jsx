import { useNavigate } from 'react-router-dom';
import bgVideo from '../../assets/videos/add.mp4';
import '../../index.css';


const Hero = ({ onOrder, onBrowse, onCustomer, onPartner, onRider }) => (
  <section className="relative overflow-hidden text-white py-16">

    {/* Background video */}
    <video src={bgVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0" />
    {/* Overlay to improve readability */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20 z-10" />
    <div className="container mx-auto px-4 lg:px-0 flex flex-col lg:flex-row items-center gap-10 relative z-20">
      <div className="lg:w-2/3">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">India’s #1 food delivery platform</h1>
        <p className="text-lg md:text-xl text-white/90 mb-6">Order from your favorite restaurants, get groceries delivered and explore curated collections — all in one app.</p>

        <div className="mt-6 w-full max-w-2xl">
          <div className="flex gap-3">
            <input id="hero-search" placeholder="Search restaurants, cuisines or dishes" className="flex-1 p-3 rounded border placeholder-gray-500" />
            <button onClick={onBrowse} className="bg-white text-red-600 font-semibold px-4 rounded">Browse</button>
            <button onClick={onOrder} className="bg-red-600 text-white font-semibold px-4 rounded">Order Now</button>
          </div>
          <div className="text-sm text-white/90 mt-3">Try searching for "pizza", "biryani", or your favourite restaurant</div>
        </div>
      </div>

      <div className="lg:w-1/3 hidden lg:block">
        <div className="bg-white rounded-lg p-6 shadow-lg text-red-600 partner-card">
          <h3 className="font-bold mb-2">Quick links</h3>
          <p className="text-sm mb-4 text-gray-600">Explore partnerships and delivery opportunities.</p>
          <div className="grid gap-3">
            <button onClick={onCustomer} className="text-left bg-blue-100 text-black border p-2 rounded">Customer</button>
            <button onClick={onPartner} className="text-left border p-2 rounded">Partner with Us</button>
            <button onClick={onRider} className="text-left bg-red-500 text-white p-2 rounded">Become a Rider</button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-2xl md:text-3xl font-bold">{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

const Stats = () => (
  <section className="py-10 bg-white">
    <div className="container mx-auto px-4 lg:px-0 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
      <Stat value="300,000+" label="Restaurants" />
      <Stat value="800+" label="Cities" />
      <Stat value="3 billion+" label="Orders delivered" />
    </div>
  </section>
);

const Feature = ({ icon, title }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">{icon}</div>
    <div className="text-sm font-medium">{title}</div>
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
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-0">
        <h2 className="text-2xl font-bold mb-6">Features</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((it) => (
            <Feature key={it} title={it} icon={iconFor(it)} />
          ))}
        </div>
      </div>
    </section>
  );
};

const GoldBenefits = () => (
  <section className="py-12">
    <div className="container mx-auto px-4 lg:px-0 max-w-4xl">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold">Gold Benefits</h3>
          <p className="text-sm text-gray-700">Free delivery on selected restaurants and up to <span className="font-semibold">30% off</span> across partner restaurants.</p>
        </div>
        <div>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded">Explore Gold</button>
        </div>
      </div>
    </div>
  </section>
);

const Services = () => {
  const services = [
    { name: 'Zomato', desc: 'Food delivery & dining' },
    { name: 'Blinkit', desc: 'Instant grocery delivery' },
    { name: 'District', desc: 'Local commerce' },
    { name: 'Hyperpure', desc: 'Restaurant supplies' },
  ];
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 lg:px-0">
        <h2 className="text-2xl font-bold mb-6">Powering India’s changing lifestyles</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {services.map(s => (
            <div key={s.name} className="p-4 border rounded hover:shadow">
              <div className="font-semibold mb-2">{s.name}</div>
              <div className="text-sm text-gray-600 mb-3">{s.desc}</div>
              <button className="text-sm text-red-500 hover:underline">Check it out</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 py-10 mt-12">
    <div className="container mx-auto px-4 lg:px-0 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div>
        <div className="text-white font-bold mb-3">Feasto Group</div>
        <ul className="text-sm space-y-1">
          <li>Eternal</li>
          <li>Zomato</li>
          <li>Blinkit</li>
          <li>District</li>
          <li>Hyperpure</li>
        </ul>
      </div>
      <div>
        <div className="text-white font-bold mb-3">For partners</div>
        <ul className="text-sm space-y-1"><li>Restaurant Partners</li><li>Delivery Partners</li><li>Investor Relations</li></ul>
      </div>
      <div>
        <div className="text-white font-bold mb-3">Company</div>
        <ul className="text-sm space-y-1"><li>About</li><li>Careers</li><li>Blog</li></ul>
      </div>
      <div>
        <div className="text-white font-bold mb-3">Legal</div>
        <ul className="text-sm space-y-1"><li>Privacy</li><li>Security</li><li>Terms of Service</li></ul>
      </div>
    </div>
    <div className="container mx-auto px-4 lg:px-0 text-sm text-gray-500 mt-6">© {new Date().getFullYear()} Feasto — All rights reserved</div>
  </footer>
);

export default function Welcome() {
  const navigate = useNavigate();

  const onOrder = () => navigate('/');
  const onBrowse = () => navigate('/');
  const onPartner = () => navigate('/partner-with-us');
  const onRider = () => navigate('/become-rider');
  const onCustomer = () => navigate('/become-customer');

  return (
    <div className="min-h-screen font-sans bg-white text-gray-800">
      <Hero onOrder={onOrder} onBrowse={onBrowse} onCustomer={onCustomer} onPartner={onPartner} onRider={onRider} />
      <Stats />
      <Features />
      <GoldBenefits />
      <Services />

      <div className="container mx-auto px-4 lg:px-0 py-8 flex gap-4 justify-center">
        <button onClick={() => navigate('/partner-with-us')} className="bg-red-600 text-white px-4 py-2 rounded">Partner with us</button>
        <button onClick={() => navigate('/become-rider')} className="border border-red-600 text-red-600 px-4 py-2 rounded">Become a rider</button>
        <button onClick={() => navigate('/become-customer')} className="bg-red-600 text-white px-4 py-2 rounded">Customer</button>
      </div>

      <Footer />
    </div>
  );
}