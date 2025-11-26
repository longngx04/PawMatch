import Message from '../models/messageModel.js';
import Match from '../models/matchModel.js';
import { emitNewMessageToRoom, emitNewMessage } from '../lib/socket.js';

/**
 * Send a message in a match
 * POST /api/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const { matchId, text, image } = req.body;
    const senderId = req.user._id;

    if (!matchId || !text) {
      return res.status(400).json({ message: 'Match ID and message text are required' });
    }

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.owner1.toString() !== senderId.toString() &&
      match.owner2.toString() !== senderId.toString()) {
      return res.status(403).json({ message: 'Not authorized to send messages in this match' });
    }

    if (match.status !== 'active') {
      return res.status(400).json({ message: 'Cannot send messages to inactive match' });
    }

    // Determine receiver
    const receiverId = match.owner1.toString() === senderId.toString()
      ? match.owner2
      : match.owner1;

    // Create message
    const message = await Message.create({
      match: matchId,
      sender: senderId,
      receiver: receiverId,
      text: text,
      image: image || undefined
    });

    // Update match's last message
    match.lastMessage = message._id;
    match.lastMessageAt = new Date();
    await match.save();

    // Populate message details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullname email profilePicture')
      .populate('receiver', 'fullname email profilePicture');

    // Emit via Socket.IO to match room
    emitNewMessageToRoom(matchId, populatedMessage);

    // Also emit to specific receiver (fallback)
    emitNewMessage(receiverId.toString(), populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get all messages in a match
 * GET /api/messages/:matchId
 */
export const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    // Verify match
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.owner1.toString() !== userId.toString() &&
      match.owner2.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    // Get messages
    const messages = await Message.find({ match: matchId })
      .populate('sender', 'fullname email profilePicture')
      .populate('receiver', 'fullname email profilePicture')
      .sort({ createdAt: 1 });

    // Mark as read
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
    console.error('Error in getMessages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all matches with last message (for chat list)
 * GET /api/messages/matches
 */
export const getMatchesWithMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const matches = await Match.find({
      $or: [{ owner1: userId }, { owner2: userId }],
      status: 'active'
    })
      .populate('pet1', 'name images breed species')
      .populate('pet2', 'name images breed species')
      .populate('owner1', 'fullname email profilePicture')
      .populate('owner2', 'fullname email profilePicture')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

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
    console.error('Error in getMatchesWithMessages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};