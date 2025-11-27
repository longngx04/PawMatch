import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    sendMessage,
    getMessages,
    getMatchesWithMessages
} from '../controllers/message.controller.js';

const router = express.Router();

router.use(protectRoute);

router.get('/matches', getMatchesWithMessages);
router.post('/', sendMessage);
router.get('/:matchId', getMessages);

export default router;