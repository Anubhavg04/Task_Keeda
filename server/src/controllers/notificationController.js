import mongoose from 'mongoose';
import InAppNotification from '../models/InAppNotification.models.js';
import Project from '../models/Project.models.js';
import PushSubscription from '../models/PushSubscription.models.js';
import { getPushConfiguration } from '../services/pushNotifications.js';

const accessibleProjectFilter = (userId) => ({
  $or: [{ owner: userId }, { members: userId }],
});

const getAccessibleProjectIds = async (userId) => Project.find(accessibleProjectFilter(userId)).distinct('_id');

const isAllowedPushEndpoint = (value) => {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const endpoint = new URL(value);
    const hostname = endpoint.hostname.toLowerCase();
    const allowedHost = [
      'fcm.googleapis.com',
      'push.services.mozilla.com',
      'push.apple.com',
      'notify.windows.com',
    ].some((host) => hostname === host || hostname.endsWith(`.${host}`));
    return endpoint.protocol === 'https:' && allowedHost;
  } catch {
    return false;
  }
};

export const getNotificationSettings = async (req, res) => {
  try {
    const [configuration, deviceCount] = await Promise.all([
      getPushConfiguration(),
      PushSubscription.countDocuments({ user: req.user.id }),
    ]);
    res.json({ ...configuration, deviceCount });
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    res.status(500).json({ message: 'Failed to fetch notification settings' });
  }
};

export const getInAppNotifications = async (req, res) => {
  try {
    const projectIds = await getAccessibleProjectIds(req.user.id);
    if (!projectIds.length) return res.json({ notifications: [], unreadCount: 0 });

    const filter = { recipient: req.user.id, project: { $in: projectIds } };
    const [notifications, unreadCount] = await Promise.all([
      InAppNotification.find(filter)
        .populate('actor', 'fullname')
        .populate('project', 'name')
        .populate('task', 'title')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      InAppNotification.countDocuments({ ...filter, readAt: null }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Failed to fetch in-app notifications:', error);
    res.status(500).json({ message: 'Failed to fetch in-app notifications' });
  }
};

export const markInAppNotificationRead = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid notification id' });
  }

  try {
    const projectIds = await getAccessibleProjectIds(req.user.id);
    const notification = await InAppNotification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id, project: { $in: projectIds } },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Failed to mark in-app notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const markAllInAppNotificationsRead = async (req, res) => {
  try {
    const projectIds = await getAccessibleProjectIds(req.user.id);
    if (projectIds.length) {
      await InAppNotification.updateMany(
        { recipient: req.user.id, project: { $in: projectIds }, readAt: null },
        { $set: { readAt: new Date() } }
      );
    }
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Failed to mark all in-app notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};

export const savePushSubscription = async (req, res) => {
  const { endpoint, keys } = req.body;
  if (
    !isAllowedPushEndpoint(endpoint) ||
    !keys ||
    typeof keys !== 'object' ||
    typeof keys.p256dh !== 'string' ||
    !keys.p256dh ||
    keys.p256dh.length > 256 ||
    typeof keys.auth !== 'string' ||
    !keys.auth ||
    keys.auth.length > 256
  ) {
    return res.status(400).json({ message: 'A valid mobile push subscription is required' });
  }

  if (!getPushConfiguration().enabled) {
    return res.status(503).json({ message: 'Mobile notifications are not configured on this server' });
  }

  try {
    const existing = await PushSubscription.findOne({ endpoint }).select('_id user').lean();
    const alreadyOwnedByUser = existing && String(existing.user) === String(req.user.id);
    if (!alreadyOwnedByUser && await PushSubscription.countDocuments({ user: req.user.id }) >= 10) {
      return res.status(429).json({ message: 'A maximum of 10 notification-enabled devices is allowed per account' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { $set: { user: req.user.id, endpoint, keys } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ message: 'Mobile notifications enabled on this device' });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    res.status(500).json({ message: 'Failed to enable mobile notifications' });
  }
};

export const removePushSubscription = async (req, res) => {
  const { endpoint } = req.body;
  if (!isAllowedPushEndpoint(endpoint)) {
    return res.status(400).json({ message: 'A valid push endpoint is required' });
  }

  try {
    await PushSubscription.deleteOne({ user: req.user.id, endpoint });
    res.json({ message: 'Mobile notifications disabled on this device' });
  } catch (error) {
    console.error('Failed to remove push subscription:', error);
    res.status(500).json({ message: 'Failed to disable mobile notifications' });
  }
};
