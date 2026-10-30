import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      maxlength: 2048,
    },
    keys: {
      p256dh: { type: String, required: true, maxlength: 256 },
      auth: { type: String, required: true, maxlength: 256 },
    },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
