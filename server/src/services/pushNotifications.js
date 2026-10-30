import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.models.js';

const getVapidConfiguration = () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (
    !VAPID_PUBLIC_KEY ||
    !VAPID_PRIVATE_KEY ||
    !VAPID_SUBJECT ||
    !/^(mailto:|https:\/\/)/i.test(VAPID_SUBJECT)
  ) return null;
  return { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY, subject: VAPID_SUBJECT };
};

export const getPushConfiguration = () => {
  const configuration = getVapidConfiguration();
  return {
    enabled: Boolean(configuration),
    publicKey: configuration?.publicKey || '',
  };
};

export const sendPushToUser = async (userId, notification) => {
  const configuration = getVapidConfiguration();
  if (!configuration) return;

  const subscriptions = await PushSubscription.find({ user: userId }).lean();
  if (!subscriptions.length) return;

  webpush.setVapidDetails(configuration.subject, configuration.publicKey, configuration.privateKey);
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
  });

  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        payload,
        { TTL: 60 * 60 * 24 }
      );
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subscription._id });
        return;
      }
      throw error;
    }
  }));

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error('Failed to send a TaskFlow push notification:', {
        subscriptionId: String(subscriptions[index]._id),
        statusCode: result.reason?.statusCode,
        message: result.reason?.message,
      });
    }
  });
};
