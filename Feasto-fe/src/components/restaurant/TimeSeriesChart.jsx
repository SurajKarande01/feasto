import Chart from 'react-apexcharts';

// Props: labels: string[], series: number[], metric: 'orders'|'revenue', chartType: 'line'|'bar', currency?
const TimeSeriesChart = ({ labels = [], series = [], metric = 'orders', chartType = 'line', currency = '₹' }) => {
  const options = {
    chart: {
      id: 'timeseries',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
    },
    xaxis: {
      categories: labels,
      labels: { 
        rotate: -45,
        style: {
          colors: '#64748b',
          fontSize: '10px',
          fontWeight: 600,
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '10px',
          fontWeight: 600,
        }
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
    colors: [metric === 'revenue' ? '#f43f5e' : '#1e293b'],
    stroke: { 
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: chartType === 'bar' ? 'solid' : 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'light',
      y: {
        formatter: function (val) {
          if (metric === 'revenue') return currency + val.toLocaleString();
          return val.toString();
        }
      }
    }
  };

  const seriesObj = [{ name: metric === 'revenue' ? 'Revenue' : 'Orders', data: series }];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] w-full">
      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-4 px-1">
        {metric === 'revenue' ? 'Sales Revenue Trend' : 'Order Volume Trend'}
      </div>
      <Chart options={options} series={seriesObj} type={chartType} height={300} />
    </div>
  );
};

export default TimeSeriesChart;
