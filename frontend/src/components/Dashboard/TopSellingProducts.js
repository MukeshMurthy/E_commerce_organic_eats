import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import './TopSellingProducts.css';

export default function TopSellingChart() {
  const [series, setSeries] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/admin/top-selling')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const chartSeries = data.map(item => Number(item.total_sold)); // Convert to number
        const chartLabels = data.map(item => item.name);

        setSeries(chartSeries);
        setLabels(chartLabels);
      })
      .catch((err) => {
        console.error('Failed to fetch top selling data:', err);
      });
  }, []);

  const options = {
    chart: {
      type: 'donut',
    },
    labels: labels,
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'right',
      offsetY: 0,
      height: 230,
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          show: false
        }
      }
    }],
  };

  return (
    <div className="table-card">
      <h3>Top Selling Products</h3>
      {series.length > 0 ? (
        <ReactApexChart options={options} series={series} type="donut" width="100%" />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
}
