import express from 'express';
import {
    getUserProfile,
    getUserById,
    updateUserProfile,
    changePassword,
    deleteUserAccount
} from '../controllers/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get current user profile
router.get('/profile', getUserProfile);

// Get user by ID
router.get('/:userId', getUserById);

// Update user profile
router.put('/profile', updateUserProfile);

// Change password
router.put('/change-password', changePassword);

// Delete user account
router.delete('/profile', deleteUserAccount);

export default router;