import React, { useEffect, useState } from 'react';
import { FaShoppingCart, FaDollarSign, FaUsers, FaClock } from 'react-icons/fa';
import './KPICards.css';

export default function KPICards() {
  const [data, setData] = useState({
    total_orders: 0,
    total_revenue: 0,
    total_users: 0,
    pending_orders: 0,
  });

  useEffect(() => {
    fetch('http://localhost:5001/api/admin/metrics')
      .then((r) => r.json())
      .then((res) => setData(res));
  }, []);

  return (
    <div className="kpi-cards">
      <div className="card">
        <FaShoppingCart className="icon" />
        <h3>{data.total_orders}</h3>
        <p>Total Orders</p>
      </div>

      <div className="card">
        <FaDollarSign className="icon" />
        <h3>₹{data.total_revenue?.toFixed(2)}</h3>
        <p>Revenue</p>
      </div>

      <div className="card">
        <FaUsers className="icon" />
        <h3>{data.total_users}</h3>
        <p>Customers</p>
      </div>

      <div className="card">
        <FaClock className="icon" />
        <h3>{data.pending_orders || 0}</h3>
        <p>Pending Orders</p>
      </div>
    </div>
  );
}
