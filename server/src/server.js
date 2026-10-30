import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
dotenv.config();

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured before starting TaskFlow.');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`TaskFlow API is listening on port ${PORT}`);
    });
});