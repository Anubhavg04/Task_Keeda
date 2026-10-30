import express from 'express';
import {
  getNotificationSettings,
  removePushSubscription,
  savePushSubscription,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/settings', getNotificationSettings);
router.post('/subscriptions', savePushSubscription);
router.delete('/subscriptions', removePushSubscription);

export default router;
