import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { getPushConfiguration } from './services/pushNotifications.js';
dotenv.config();

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured before starting TaskFlow.');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}
if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_ORIGIN) {
    console.warn('CLIENT_ORIGIN is not set; CORS will only allow http://localhost:5173.');
}
if (!getPushConfiguration().enabled) {
    console.warn('Push notifications are disabled: set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT (must start with mailto: or https://).');
}

connectDB()
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log(`TaskFlow API is listening on port ${PORT}`);
        });
        server.keepAliveTimeout = 65_000;
        server.headersTimeout = 66_000;

        const shutdown = (signal) => {
            console.log(`${signal} received, shutting down.`);
            server.close(() => process.exit(0));
            setTimeout(() => process.exit(1), 10_000).unref();
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((error) => {
        console.error('Failed to start TaskFlow API:', error);
        process.exit(1);
    });