const StatCards = ({ title, value, subtitle }) => (
  <div className="bg-white/90 rounded-lg shadow p-4 flex flex-col w-full">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-bold mt-2">{value}</div>
    {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
  </div>
);

export default StatCards;
