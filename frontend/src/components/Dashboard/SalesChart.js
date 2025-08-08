import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import './SalesChart.css';

export default function SalesChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/admin/sales-over-time')
      .then((res) => res.json())
      .then((result) => {
        const formatted = result.map((item) => ({
          date: new Date(item.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          }),
          total_sales: parseFloat(item.total_sales || 0),
          total_orders: parseInt(item.total_orders || 0),
        }));
        setData(formatted);
      })
      .catch((err) => {
        console.error('Failed to fetch sales data:', err);
      });
  }, []);

  return (
    <div className="chart-card">
      <h3>Sales & Orders Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4e73df" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4e73df" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1cc88a" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1cc88a" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'total_sales') return [`₹${value.toFixed(2)}`, 'Sales'];
              return [value, 'Orders'];
            }}
          />

          {/* SALES (plotted first for visual stacking) */}
          <Area
            type="monotone"
            dataKey="total_sales"
            stroke="#4e73df"
            fillOpacity={1}
            fill="url(#colorSales)"
            name="Sales"
          />

          {/* ORDERS */}
          <Area
            type="monotone"
            dataKey="total_orders"
            stroke="#1cc88a"
            fillOpacity={1}
            fill="url(#colorOrders)"
            name="Orders"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
