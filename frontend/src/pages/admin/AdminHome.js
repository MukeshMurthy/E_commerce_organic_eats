import React, { useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import KPICards from '../../components/Dashboard/KPICards';
import SalesChart from '../../components/Dashboard/SalesChart';
import CategoryPieChart from '../../components/Dashboard/CategoryPieChart';
import TopSellingProducts from '../../components/Dashboard/TopSellingProducts';
import StockAlerts from '../../components/Dashboard/StockAlerts';
import CustomToast from '../../components/toast/CustomToast';
import GeoDistribution from '../../components/Dashboard/GeoDistribution';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const toastRef = useRef();

  useEffect(() => {
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    const user = JSON.parse(localStorage.getItem('user'));

    if (justLoggedIn === 'true' && user?.role === 'admin') {
      toastRef.current?.showSuccess(`Welcome back, Admin ${user.name || ''}!`);
      localStorage.removeItem('justLoggedIn');
    }
  }, []);

  return (
    <AdminLayout>
      <CustomToast ref={toastRef} />

      <h2>Dashboard Overview</h2>

      {/* KPI Cards Row */}
      <KPICards />

      {/* Sales Chart Full Width */}
      <div className="sales-chart">
        <SalesChart />
      </div>

      {/* Donut Chart + Top Selling List */}
      <div className="chart-grid">
        <div className="donut-chart">
          <CategoryPieChart />
        </div>
        <div className="top-selling-list">
          <TopSellingProducts />
        </div>
      </div>

      <div className="geo-section">
  <GeoDistribution />
</div>

      {/* Stock Alerts at Bottom */}
      <div className="stock-alert-section">
        <StockAlerts />
      </div>
    </AdminLayout>
  );
}
