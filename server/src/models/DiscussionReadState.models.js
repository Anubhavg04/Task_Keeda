import mongoose from 'mongoose';

const discussionReadStateSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionMessage',
      default: null,
    },
  },
  { timestamps: true }
);

discussionReadStateSchema.index({ project: 1, user: 1 }, { unique: true });

export default mongoose.model('DiscussionReadState', discussionReadStateSchema);
