import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.models.js";

const router = express.Router();

router.get("/user", async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ user: null });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('fullname email role');
        if (!user) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
            return res.json({ user: null });
        }
        res.json({ user });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
            return res.json({ user: null });
        }
        console.error('Failed to fetch current user:', error);
        res.status(500).json({ message: 'Failed to fetch current user' });
    }
});

export default router;