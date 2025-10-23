import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
export const signup = async(req, res) =>{
   const{fullname, email, password} = req.body;

   try{
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

    if(newUser){
        
    }
    else{
        return res.status(400).json({ message: 'Invalid user data' });
    }


   } catch(error){
       return res.status(500).json({ message: 'Internal server error' });
   }
} 