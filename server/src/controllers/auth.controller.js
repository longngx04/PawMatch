import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/ultils.js';
import { sendWelcomeEmail } from '../emails/emailHandlers.js';
import 'dotenv/config';

/**
 * Đăng ký user mới
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        // Validation: Check required fields
        if (!fullname || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validation: Password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Validation: Email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        });

        // Generate JWT token và set cookie
        generateToken(newUser._id, res);
        
        // Save user vào database
        await newUser.save();

        // Response success
        res.status(201).json({
            _id: newUser._id,
            fullname: newUser.fullname,
            email: newUser.email,
            profilePicture: newUser.profilePicture,
        });

        // Gửi welcome email (async, không block response)
        try {
            await sendWelcomeEmail(newUser.email, newUser.fullname, process.env.CLIENT_URL);
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Không throw error, vì user đã được tạo thành công
        }

    } catch (error) {
        console.error("Error in signup controller:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Đăng nhập user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validation: Check required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Tìm user theo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token và set cookie
        generateToken(user._id, res);

        // Response success
        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            profilePicture: user.profilePicture,
        });

    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Đăng xuất user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
    try {
        // Clear JWT cookie
        res.cookie("jwt", "", { 
            maxAge: 0,
            httpOnly: true,
            sameSite: 'strict'
        });
        
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout controller:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Check auth status
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getMe controller:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
