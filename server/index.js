
import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.route.js'
import {connectDB} from './src/lib/db.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
dotenv.config()

const app = express()

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());


const PORT = process.env.PORT || 3000

app.use(express.json())

console.log(process.env.PORT)

app.use('/auth', authRoutes)


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB()
});