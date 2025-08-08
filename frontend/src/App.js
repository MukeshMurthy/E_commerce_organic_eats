import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/Landingpage';
import UserHome from './pages/UserHome';
import AdminHome from './pages/admin/AdminHome';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/checkoutPage/CheckoutPage';
import { CartProvider } from './context/cartContext';
import OrderPage from './pages/Orderpage';
import AdminProductManager from './pages/admin/AdminProductManager';
import AdminOrderManager from './pages/admin/AdminOrderManager';
import UserList from './pages/admin/UserList';
import ReviewManager from './pages/admin/ReviewManager';
import AdminProtectedRoute from './components/Auth/AdminProtectedRoute';
import checkAuth from './components/Auth/checkAuth';
// PrimeReact core styles
import 'primereact/resources/themes/saga-blue/theme.css'; // You can change to another theme if you prefer
import 'primereact/resources/primereact.min.css';          // Core styles
import 'primeicons/primeicons.css';                        // Icons (needed for dialog icons)


function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/user/home" element={<UserHome />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cart" element={<checkAuth><CartPage /></checkAuth>} />
          <Route path="/orders" element={<checkAuth><OrderPage /></checkAuth>} />

          {/* ✅ Admin Protected Routes */}
          <Route path="/admin/home" element={
            <AdminProtectedRoute>
              <AdminHome />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <AdminProtectedRoute>
              <AdminProductManager />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminProtectedRoute>
              <AdminOrderManager />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <UserList />
            </AdminProtectedRoute>
          } />
          <Route path="/admin/reviews" element={
            <AdminProtectedRoute>
              <ReviewManager />
            </AdminProtectedRoute>
          } />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
