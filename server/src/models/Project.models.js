import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    color: {
      type: String,
      enum: ['orange', 'violet', 'blue', 'emerald', 'amber', 'rose'],
      default: 'orange',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, updatedAt: -1 });
projectSchema.index({ members: 1, updatedAt: -1 });

export default mongoose.model('Project', projectSchema);
