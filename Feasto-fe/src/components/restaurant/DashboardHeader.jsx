import { Link } from 'react-router-dom';

const DashboardHeader = ({ name, address, phone }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full mb-6">
      <div>
        <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest block mb-0.5">Merchant portal</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{name}</h1>
        {address && <p className="text-xs font-semibold text-slate-400 mt-2">📍 {address}</p>}
        {phone && <p className="text-xs font-bold text-slate-400 mt-1">📞 {phone}</p>}
      </div>
      <div className="flex gap-3 shrink-0">
        <Link 
          to="/menu-management" 
          className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all duration-200 text-center"
        >
          Manage Menu
        </Link>
        <Link 
          to="/restaurant-orders" 
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all duration-200 shadow-sm text-center"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
};

export default DashboardHeader;
