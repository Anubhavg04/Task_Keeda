import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app = express();

// Middleware
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.urlencoded({extended:true}))
app.use((req, res, next) => {
    if (req.body === undefined) {
        req.body = {};
    } else if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Request body must be a JSON object' });
    }
    next();
});
app.use(
    cors({
        origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim()),
        credentials: true,
    })
);

import authRoutes from './routes/authRoutes.js'
app.use("/api/auth", authRoutes);

import userRoutes from './routes/userRoutes.js';
app.use("/api/users",userRoutes);

import taskRoutes from "./routes/taskRoutes.js";
app.use("/api/tasks", taskRoutes);

import projectRoutes from "./routes/projectRoutes.js";
app.use("/api/projects", projectRoutes);

import noteRoutes from "./routes/noteRoutes.js";
app.use("/api/notes", noteRoutes);

import notificationRoutes from "./routes/notificationRoutes.js";
app.use("/api/notifications", notificationRoutes);

app.get("/", (req,res) =>{
    res.json({message: "TaskFlow API running"});
});

app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API route not found' });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    if (status === 500) {
        console.error('Unhandled request error:', error);
    }
    res.status(status).json({
        message: status === 413
            ? 'Request body is too large'
            : status === 400
                ? 'Invalid request body'
                : 'Internal server error',
    });
});

export default app;