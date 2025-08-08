# 🛒 Organic Eats – E-commerce Platform

**Organic Eats** is a full-featured e-commerce web application that allows users to browse organic products, manage their cart, place orders, and more. Built with **React.js**, **Node.js (Express)**, and **PostgreSQL**, it supports both customer and admin functionalities.

---

## 🚀 Features

### 👤 User Features:
- Sign up / Login with authentication.
- Browse organic products by categories.
- Add products to cart and update quantities.
- Place orders with shipping and payment details.
- Apply discount coupons at checkout.
- Manage and select saved addresses.
- View and cancel order history.
- Leave product reviews.

### 🛠️ Admin Features:
- Admin dashboard with KPIs and charts.
- Add, update, archive or delete products.
- Track low stock and top-selling items.
- View and manage all user orders.
- Monitor coupon usage and delivery regions.
- Create new admin accounts with email verification.

---

## 🏗️ Tech Stack

| Frontend        | Backend             | Database   |
|----------------|---------------------|------------|
| React.js        | Node.js + Express.js | PostgreSQL |

---

## 📁 Project Structure

```
/client             → React frontend (pages, components, styles)
/server             → Express backend
/server/routes      → API endpoints (cart, auth, orders, products)
/server/controllers → Logic handlers for each route
/server/db          → PostgreSQL DB configuration
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/MukeshMurthy/E_commerce_organic_eats.git
cd E_commerce_organic_eats
```

### 2. Install Dependencies

#### For frontend:
```bash
cd client
npm install
```

#### For backend:
```bash
cd ../server
npm install
```

### 3. Create `.env` file in `/server`

```
PORT=5000
DATABASE_URL=your_postgres_url
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_token
```

### 4. Run Development Servers

- Start backend:
  ```bash
  npm start
  ```

- Start frontend:
  ```bash
  cd ../client
  npm start
  ```

---

## 📦 Database Schema

- `users` – Customers and admins
- `products` – Organic product catalog
- `orders` – Placed order details
- `cart` – User cart management
- `coupons` – Discount codes
- `addresses` – Saved shipping addresses
- `reviews` – Product feedback and ratings

---

## 📊 Admin Dashboard Includes

- KPI cards: Total Sales, Orders, Revenue, Stock Alerts
- Category pie chart
- Sales overview line chart
- Top-selling products list
- Recent orders table
- Geo distribution of deliveries

---

## 🔐 Authentication & Security

- Password hashing with bcrypt
- JWT-based user authentication
- Role-based route protection (admin vs user)
- Email verification for admin creation

---

## 🧠 Future Enhancements

- Razorpay or Stripe payment gateway integration
- Wishlist and product comparison
- Real-time order status tracking
- PWA support for mobile users
- Admin role delegation and logs

---

## 📌 Author

**Mukesh Murthy**

GitHub: [@MukeshMurthy](https://github.com/MukeshMurthy)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
