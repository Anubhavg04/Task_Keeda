import User from "../models/User.models.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

//  /api/auth/register
export const register = async(req,res)=>{
    try {
        const {fullname, email, password} = req.body;

        if(!fullname || !email || !password){
            return res.status(400).json({
                message: " All fields are required"
            });
        }

        const existAlready = await User.findOne({email});
        if(existAlready){
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const user =  await User.create({
            fullname,
            email,
            password : hashedPassword,
        });
        console.log(user);

        res.status(201).json({
            message : "User registered successfully",
            user:{
                id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
        });

    } catch (error) {
        res.status(500).json({
            message:"Server error"
        })
    }
};

// /api/auth/login
export const login = async(req,res)=>{
    try {
        const{ email , password } = req.body;
        if(!email || !password){
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({
                message:"Invalid credentials"
            });
        }

        const isMatched = await bcrypt.compare(password, user.password);
        if(!isMatched){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {id: user._id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        res.cookie("token", token, {
            httpOnly :  true,
            secure   :  false,
            sameSite :  'lax'
        });

        res.json({
            message: "Login succesfful",
            user:{ 
                id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
};