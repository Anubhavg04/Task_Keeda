import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}))
app.use(
    cors({
        origin:"http://localhost:5173",
        credentials: true,
    })
);

import authRoutes from './routes/authRoutes.js'
app.use("/api/auth", authRoutes);

import userRoutes from './routes/userRoutes.js';
app.use("/api/users",userRoutes);

import taskRoutes from "./routes/taskRoutes.js";
app.use("/api/tasks", taskRoutes);

app.get("/", (req,res) =>{
    res.json({message: "TaskFlow API running"});
});



export default app;