import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;
const userSocketMap = new Map(); // Map userId to socketId

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:5174'],
            credentials: true,
            methods: ['GET', 'POST']
        }
    });

    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                // Allow connection without token (optional)
                console.log('Socket connected without token');
                return next();
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error.message);
            // Allow connection even if token is invalid
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        const userId = socket.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User ${userId} mapped to socket ${socket.id}`);

            // Emit online status to all clients
            io.emit('user-online', userId);
        }

        // Join a match room
        socket.on('join-match', (matchId) => {
            socket.join(matchId);
            console.log(`Socket ${socket.id} joined match room: ${matchId}`);
        });

        // Leave a match room
        socket.on('leave-match', (matchId) => {
            socket.leave(matchId);
            console.log(`Socket ${socket.id} left match room: ${matchId}`);
        });

        // Typing indicators
        socket.on('typing-start', ({ matchId, userName }) => {
            socket.to(matchId).emit('user-typing', { matchId, userName });
        });

        socket.on('typing-stop', ({ matchId }) => {
            socket.to(matchId).emit('user-stopped-typing', { matchId });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            if (userId) {
                userSocketMap.delete(userId);
                io.emit('user-offline', userId);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap.get(receiverId);
};

// Emit new message to specific user
export const emitNewMessage = (receiverId, message) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('new-message', message);
        console.log(`Message sent to user ${receiverId}`);
    }
};

// Emit new match notification
export const emitNewMatch = (userId, matchData) => {
    const userSocketId = userSocketMap.get(userId);
    if (userSocketId) {
        io.to(userSocketId).emit('new-match', matchData);
        console.log(`Match notification sent to user ${userId}`);
    }
};

// Emit new message to match room
export const emitNewMessageToRoom = (matchId, message) => {
    if (io) {
        io.to(matchId).emit('new-message', message);
        console.log(`Message sent to match room: ${matchId}`);
    }
};