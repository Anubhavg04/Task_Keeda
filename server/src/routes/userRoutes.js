import express from "express";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/user",protect,(req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user,
    });
});

export default router;