
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/ultils.js';
import { sendWelcomeEmail } from '../emails/emailHandlers.js';
import 'dotenv/config';


export const signup = async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        if (!fullname || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullname: newUser.fullname,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
            });

            try{
                await sendWelcomeEmail(newUser.email, newUser.fullname, process.env.CLIENT_URL);
            }catch(error){
                console.error("Failed to send welcome email:", error);
            }   

        }
        else {
            return res.status(400).json({ message: 'Invalid user data' });
        }


    } catch (error) {
        console.log("Error in signup controller", error)
        res.status(500).json({ message: 'Server error' });
    }
} 

export const login = async (req, res) => {
    const { email, password } = req.body;

    try{
        const user = await User.findOne({ email });
        if(!user ) return res.status(400).json({ message: 'Invalid email or password' });

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if(!isPasswordMatch) return res.status(400).json({ message: 'Invalid email or password' });

        generateToken (user._id, res);
        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            profilePicture: user.profilePicture,
        });

        

    }catch(error){
        console.log("Error in login controller", error)
        res.status(500).json({ message: 'Server error' });
    }
}

export const logout= async (req, res) => {
    res.cookie("jwt","",{maxAge:0});
    res.status(200).json({ message: "Logged out successfully"});
}