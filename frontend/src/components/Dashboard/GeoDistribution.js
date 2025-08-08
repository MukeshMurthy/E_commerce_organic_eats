import React, { useEffect, useState } from 'react';
import './GeoDistribution.css';

export default function GeoDistribution() {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/admin/geo-distribution')
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((err) => console.error('Geo Distribution error:', err));
  }, []);

  return (
    <div className="geo-distribution">
      <h3>Top Delivery Cities</h3>
      <table>
        <thead>
          <tr>
            <th>City</th>
            <th>Orders</th>
            <th>Total Items</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((c, idx) => (
            <tr key={idx}>
              <td>{c.city}</td>
              <td>{c.total_delivered_orders}</td>
              <td>{c.total_items_delivered}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
