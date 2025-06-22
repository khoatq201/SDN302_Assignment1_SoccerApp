const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Google OAuth routes
router.get('/google', authController.googleAuth);

router.get('/google/callback', authController.googleCallback);

// Logout routes
router.get('/logout', authController.logout);

module.exports = router;