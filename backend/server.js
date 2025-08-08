const express = require('express');
const cors = require('cors');
require('dotenv').config();
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const authRoutes = require('./routes/authRoutes'); 
const addressRoutes=require('./routes/addressRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();
const path = require('path');

const adminProductRoutes = require('./routes/adminProductRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const couponLogic= require('./routes/couponRoutes')
const uploadRoutes = require('./routes/uploadRoutes');
const adminVerifierRoutes=require('./routes/adminVerifierRoutes');
const { verify } = require('crypto');

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// API routes
app.use('/api/upload', uploadRoutes);

// API Routes
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/coupons',couponLogic );
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/address',addressRoutes)
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/verify',adminVerifierRoutes)
app.listen(5001, () => console.log('Server running on port 5001'));
