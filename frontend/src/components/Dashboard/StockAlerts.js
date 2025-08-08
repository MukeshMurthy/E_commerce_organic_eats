import React, { useEffect, useState } from 'react';
import './StockAlerts.css';

export default function StockAlerts() {
  const [low, setLow] = useState([]);
  useEffect(() => {
    fetch('http://localhost:5001/api/admin/stock-alerts').then(r => r.json()).then(setLow);
  }, []);
  return (
    <div className="table-card">
      <h3>Low Stock Alerts</h3>
      <ul>
        {low.map(p => <li key={p.id}>{p.name} — {p.stock} left</li>)}
      </ul>
    </div>
  );
}
