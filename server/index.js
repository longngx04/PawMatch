import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './src/routes/auth.route.js';
import petRoutes from './src/routes/pet.route.js';
import messageRoutes from './src/routes/message.route.js';
import userRoutes from './src/routes/user.route.js';
import { connectDB } from './src/lib/db.js';
import { initializeSocket } from './src/lib/socket.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

<<<<<<< Updated upstream
import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.route.js'
import {connectDB} from './src/lib/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
=======
dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.io
initializeSocket(server);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
>>>>>>> Stashed changes

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});