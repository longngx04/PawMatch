import Message from '../models/messageModel.js';
import Match from '../models/matchModel.js';
import { emitNewMessageToRoom } from '../lib/socket.js';

/**
 * Send a new message
 * POST /api/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const { matchId, text, image } = req.body;
    const senderId = req.user._id;

    console.log(' Send message request:', {
      matchId,
      senderId,
      hasText: !!text,
      hasImage: !!image
    });

    // Validation
    if (!matchId) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    if (!text && !image) {
      return res.status(400).json({ message: 'Message text or image is required' });
    }

    // Find and verify match
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify user is part of this match
    if (match.owner1.toString() !== senderId.toString() &&
      match.owner2.toString() !== senderId.toString()) {
      return res.status(403).json({ message: 'You are not part of this match' });
    }

    // Check match status
    if (match.status !== 'active') {
      return res.status(400).json({ message: 'Cannot send message to inactive match' });
    }

    // Determine receiver
    const receiverId = match.owner1.toString() === senderId.toString()
      ? match.owner2
      : match.owner1;

    console.log(' Creating message:', {
      sender: senderId,
      receiver: receiverId,
      match: matchId
    });

    // Create message
    const message = await Message.create({
      match: matchId,
      sender: senderId,
      receiver: receiverId,
      text: text || '',
      image: image || null
    });

    // Update match's last message
    match.lastMessage = message._id;
    match.lastMessageAt = new Date();
    await match.save();

    // Populate message details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullname email profilePicture')
      .populate('receiver', 'fullname email profilePicture');

    console.log(' Message created:', populatedMessage._id);

    // Emit via Socket.IO
    if (emitNewMessageToRoom) {
      emitNewMessageToRoom(matchId, populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(' Error in sendMessage:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all messages for a match
 * GET /api/messages/:matchId
 */
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    console.log(' Get messages request:', { matchId, userId });

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.owner1.toString() !== userId.toString() &&
      match.owner2.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not part of this match' });
    }

    // Get messages
    const messages = await Message.find({ match: matchId })
      .populate('sender', 'fullname email profilePicture')
      .populate('receiver', 'fullname email profilePicture')
      .sort({ createdAt: 1 }); // Oldest first

    console.log(` Found ${messages.length} messages`);

    // Mark messages as read
    await Message.updateMany(
      {
        match: matchId,
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error(' Error in getMessages:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all matches with messages
 * GET /api/messages/matches
 */
export const getMatchesWithMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(' Get matches request for user:', userId);

    // Find all active matches for this user
    const matches = await Match.find({
      $or: [{ owner1: userId }, { owner2: userId }],
      status: 'active'
    })
      .populate('pet1', 'name images breed species')
      .populate('pet2', 'name images breed species')
      .populate('owner1', 'fullname email profilePicture')
      .populate('owner2', 'fullname email profilePicture')
      .populate({
        path: 'lastMessage',
        select: 'text image createdAt'
      })
      .sort({ lastMessageAt: -1 });

    console.log(` Found ${matches.length} matches`);

    // Calculate unread count for each match
    const matchesWithUnread = await Promise.all(
      matches.map(async (match) => {
        const unreadCount = await Message.countDocuments({
          match: match._id,
          receiver: userId,
          isRead: false
        });

        return {
          ...match.toObject(),
          unreadCount
        };
      })
    );

    res.status(200).json(matchesWithUnread);
  } catch (error) {
    console.error('❌ Error in getMatchesWithMessages:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};