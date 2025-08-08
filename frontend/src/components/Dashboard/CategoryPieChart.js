import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2c4b67ff', '#31cbafff', '#ffae00ff', '#FF8042'];
export default function CategoryPieChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('http://localhost:5001/api/admin/category-sales').then(r => r.json()).then(setData);
  }, []);
  return (
    <div className="chart-card">
      <h3>Sales by Category</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
