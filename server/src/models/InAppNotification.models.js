import mongoose from 'mongoose';

const inAppNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionMessage',
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    kind: {
      type: String,
      enum: ['discussion', 'mention'],
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
      maxlength: 240,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

inAppNotificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
inAppNotificationSchema.index({ message: 1 });
inAppNotificationSchema.index({ project: 1, recipient: 1 });

export default mongoose.model('InAppNotification', inAppNotificationSchema);
