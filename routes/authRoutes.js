const express = require('express');
const { registerUser } = require('../models/User');
const multer = require('multer'); // Import multer for file uploads
const knex = require('knex')(require('../knexfile')); // Import and configure Knex
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/profile_images'; // Directory to save images
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage }); // Initialize multer with the storage configuration

// Step 1 - Register user details
router.post('/register/step1', async (req, res) => {
    const { username, email, firstName, lastName } = req.body;

    try {
        // Store basic info temporarily (you may want to use sessions or a temporary storage)
        req.session.userData = {
            username,
            email,
            firstName,
            lastName
        };

        res.status(200).json({ message: 'Step 1 completed successfully' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Step 2 - Complete registration with additional details
router.post('/register/step2', async (req, res) => {
    const { phoneNumber, country, zipCode, password } = req.body;
    console.log(req.session.userData);
    try {
        // Retrieve stored data from session or temporary storage
        const userData = req.session.userData;

        if (!userData) {
            return res.status(400).json({ error: 'No user data found for this session.' });
        }

        // Check if the username already exists
        const existingUser = await knex('Users').where({ username: userData.username }).first();
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists. Please choose another one.' });
        }

        // Combine data from both steps and register the user
        const fullUserData = { ...userData, phoneNumber, country, zipCode, password };
        const newUser = await registerUser(fullUserData);

        // Clear session data after registration
        delete req.session.userData;

        res.status(201).json({ message: 'User created successfully', userId: newUser.id });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Step 3 - Upload profile image (optional)
router.post('/register/upload-profile-image/:userId', upload.single('profileImage'), async (req, res) => {
    const { userId } = req.params;

    if (!req.file) {
        return res.status(200).json({ message: 'No profile image uploaded. Proceeding without it.' });
    }

    try {
        const user = await knex('Users').where({ id: userId }).first();
        
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Save the profile image path in the user's record
        await knex('Users').where({ id: userId }).update({
            profileImage: `/uploads/profile_images/${req.file.filename}`
        });

        res.json({ message: 'Profile image uploaded successfully', profileImageUrl: `/uploads/profile_images/${req.file.filename}` });
        
    } catch (err) {
        res.status(500).send('Error uploading file: ' + err.message);
    }
});

module.exports = router;