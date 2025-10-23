
import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './src/routes/auth.route.js'
import {connectDB} from './src/lib/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

console.log(process.env.PORT)

app.use('/auth', authRoutes)


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB()
});