import Chart from 'react-apexcharts';

// Props: labels: string[], series: number[], metric: 'orders'|'revenue', chartType: 'line'|'bar', currency?
const TimeSeriesChart = ({ labels = [], series = [], metric = 'orders', chartType = 'line', currency = '₹' }) => {
  const options = {
    chart: {
      id: 'timeseries',
      toolbar: { show: true },
      zoom: { enabled: false },
    },
    xaxis: {
      categories: labels,
      labels: { rotate: -45 },
    },
    stroke: { curve: 'smooth' },
    dataLabels: { enabled: false },
    tooltip: {
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
    <div className="bg-white rounded-lg shadow p-4">
      <Chart options={options} series={seriesObj} type={chartType} height={300} />
    </div>
  );
};

export default TimeSeriesChart;
