const StatCard = ({ title, value, subtitle }) => (
  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300 flex flex-col w-full">
    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</div>
    <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{value}</div>
    {subtitle && <div className="text-[10px] font-semibold text-slate-400 mt-1">{subtitle}</div>}
  </div>
);

export default StatCard;
