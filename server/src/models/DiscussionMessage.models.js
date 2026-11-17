import mongoose from 'mongoose';

const discussionMessageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

discussionMessageSchema.index({ project: 1, task: 1, _id: -1 });
discussionMessageSchema.index({ task: 1, _id: -1 });

export default mongoose.model('DiscussionMessage', discussionMessageSchema);
