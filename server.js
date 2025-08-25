const express = require('express');
const cors = require('cors');

// Import database connection and models
const sequelize = require('./config/database');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Check and create database tables based on models
sequelize.sync()
    .then(() => {
        console.log('Database tables have been created!');
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });

// A test link to make sure the API is running
app.get('/', (req, res) => {
    res.send('E-Outpass API is running!');
});

// We will add the API routes here in the next step