const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB } = require('./config/db'); // Your database connection logic
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

require('dotenv').config();

connectDB();

const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Configure session middleware
app.use(session({
    secret: 'thisismysecretkey123', // Change this to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/', uploadRoutes);

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
});