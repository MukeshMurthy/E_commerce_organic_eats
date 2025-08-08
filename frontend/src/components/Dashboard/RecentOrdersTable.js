import React, { useEffect, useState } from 'react';
import './RecentOrdersTable.css';

export default function RecentOrdersTable() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetch('http://localhost:5001/api/admin/od').then(r => r.json()).then(setOrders);
  }, []);
  return (
    <div className="table-card">
      <h3>Recent Orders</h3>
      <table>
        <thead><tr><th>ID</th><th>User</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td><td>{o.user_name}</td><td>₹{o.total_amount}</td><td>{o.status}</td>
              <td>{new Date(o.order_date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
