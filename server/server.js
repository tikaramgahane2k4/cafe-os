require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3010;
connectDB();
// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
// mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cafe-os')
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.error('MongoDB connection error:', err));

// Routes
const menuRoutes = require('./routes/menuRoutes');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const staffRoutes = require('./routes/staff');
const customerRoutes = require('./routes/customer');

app.use('/api/menu', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);

app.get('/', (req, res) => {
    res.send('Cafe OS API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



