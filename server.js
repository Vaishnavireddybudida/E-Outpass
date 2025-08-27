// =========================================
//  SERVER & DATABASE SETUP
// =========================================
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Import database connection and models
const sequelize = require('./config/database');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());        // Middleware to handle Cross-Origin Resource Sharing

// A test link to make sure the API is running
app.get('/', (req, res) => {
    res.send('E-Outpass API is running!');
});


// =========================================
//  EMAIL NOTIFICATION SETUP
// =========================================
const nodemailer = require('nodemailer');

// Create a transporter object using your Gmail details from environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

/**
 * Sends an email notification to a student.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} studentName - The student's name.
 * @param {string} outpassId - The ID of the outpass.
 * @param {string} status - The status (Approved or Rejected).
 */
const sendOutpassStatusEmail = (toEmail, studentName, outpassId, status) => {
    const mailOptions = {
        from: `"E-Outpass System" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Outpass Request Update - ID: ${outpassId}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #004d99;">E-Outpass System Notification</h2>
                <p>Dear ${studentName},</p>
                <p>This is to inform you about the status of your recent outpass request (ID: <strong>${outpassId}</strong>).</p>
                <p>The request has been **<strong style="color: ${status === 'Approved' ? 'green' : 'red'};">${status.toUpperCase()}</strong>** by the HOD.</p>
                <p>For more details, please log in to the E-Outpass portal.</p>
                <br>
                <p>Thank you,<br>The E-Outpass Team</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent successfully:', info.response);
        }
    });
};


// =========================================
//  API ROUTES
// =========================================

// Example Route for user authentication (login, register)
app.post('/api/auth/register', (req, res) => {
    // Logic for user registration
    res.send('User registration endpoint');
});

app.post('/api/auth/login', (req, res) => {
    // Logic for user login
    res.send('User login endpoint');
});

// Example Route for outpass requests
app.post('/api/outpass/request', (req, res) => {
    // Logic for creating a new outpass request
    res.send('Outpass request endpoint');
});

// Route for HOD/Mentor to update outpass status
app.post('/api/outpass/update-status', async (req, res) => {
    const { outpassId, status } = req.body;

    try {
        // Find the leave request by its primary key (ID)
        const leaveRequest = await LeaveRequest.findByPk(outpassId);

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Outpass request not found.' });
        }

        // Update the status of the leave request
        leaveRequest.status = status;
        await leaveRequest.save();

        // Get the user (student) details associated with this outpass
        // Assuming your LeaveRequest model has a `userId` foreign key
        const student = await User.findByPk(leaveRequest.userId);

        if (student && student.email && student.name) {
            // Call the email function to send the notification
            sendOutpassStatusEmail(student.email, student.name, leaveRequest.id, leaveRequest.status);
        }

        res.json({ message: 'Outpass status updated successfully and notification sent.' });

    } catch (err) {
        console.error('Error updating outpass status:', err);
        res.status(500).json({ message: 'Failed to update outpass status.', error: err.message });
    }
});


// =========================================
//  SERVER START
// =========================================

// Check and create database tables based on models
sequelize.sync()
    .then(() => {
        console.log('Database tables have been created!');
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });