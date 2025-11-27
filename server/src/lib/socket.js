import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;
const userSocketMap = new Map(); // userId -> socketId

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true
        }
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                console.log(' Socket connection without token');
                return next(); // Allow connection without auth for now
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            console.log(' Socket authenticated:', decoded.userId);
            next();
        } catch (error) {
            console.error(' Socket auth error:', error);
            next(); // Allow connection even if token is invalid
        }
    });

    io.on('connection', (socket) => {
        console.log(' User connected:', socket.id);

        const userId = socket.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(` User ${userId} mapped to socket ${socket.id}`);
            
            // Broadcast user online status
            io.emit('user-online', userId);
        }

        // Join match room
        socket.on('join-match', (matchId) => {
            socket.join(matchId);
            console.log(` Socket ${socket.id} joined match room: ${matchId}`);
        });

        // Leave match room
        socket.on('leave-match', (matchId) => {
            socket.leave(matchId);
            console.log(` Socket ${socket.id} left match room: ${matchId}`);
        });

        // Typing indicators
        socket.on('typing-start', ({ matchId, receiverId }) => {
            socket.to(matchId).emit('user-typing', { 
                matchId, 
                userName: socket.userId 
            });
            console.log(` User typing in match: ${matchId}`);
        });

        socket.on('typing-stop', ({ matchId, receiverId }) => {
            socket.to(matchId).emit('user-stopped-typing', { matchId });
            console.log(` User stopped typing in match: ${matchId}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(' User disconnected:', socket.id);
            
            if (userId) {
                userSocketMap.delete(userId);
                io.emit('user-offline', userId);
            }
        });
    });

    console.log(' Socket.IO initialized');
    return io;
};

// Emit new message to match room
export const emitNewMessageToRoom = (matchId, message) => {
    if (io) {
        console.log(` Emitting message to room: ${matchId}`);
        io.to(matchId).emit('new-message', message);
    } else {
        console.error(' Socket.IO not initialized');
    }
};

// Emit new match to specific user
export const emitNewMatch = (userId, matchData) => {
    if (io) {
        const socketId = userSocketMap.get(userId);
        if (socketId) {
            console.log(` Emitting new match to user: ${userId}`);
            io.to(socketId).emit('new-match', matchData);
        }
    }
};

export const getIO = () => io;