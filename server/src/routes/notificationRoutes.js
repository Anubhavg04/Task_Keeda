import express from 'express';
import {
  getInAppNotifications,
  getNotificationSettings,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  removePushSubscription,
  savePushSubscription,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/in-app', getInAppNotifications);
router.post('/in-app/read-all', markAllInAppNotificationsRead);
router.patch('/in-app/:id/read', markInAppNotificationRead);
router.get('/settings', getNotificationSettings);
router.post('/subscriptions', savePushSubscription);
router.delete('/subscriptions', removePushSubscription);

export default router;
