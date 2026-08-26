const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 4444;
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;
const mongoose = require('mongoose');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);


async function startServer(){
  try{
    await mongoose.connect(MONGO_URI);
    console.log('connected to MongoDB');
    app.listen(PORT, () => {
  console.log(`Server is LIVE and listening on PORT ${PORT}`);
});
  }catch(err){
    console.error('Failed to connect to MongoDB:', err.message);
  }
}

startServer();