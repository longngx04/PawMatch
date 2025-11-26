import express from 'express';
import {
    sendMessage,
    getMessages,
    getMatchesWithMessages,
    deleteMessage
} from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Send a message
router.post('/', sendMessage);

// Get all matches with last message (for chat list)
router.get('/matches', getMatchesWithMessages);

// Get all messages in a specific match
router.get('/:matchId', getMessages);

// Delete a message
router.delete('/:messageId', deleteMessage);

export default router;