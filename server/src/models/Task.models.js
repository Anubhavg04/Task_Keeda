import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["todo","in-progress","done"],
            default: "todo",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        estimatedHours: {
            type: Number,
            min: 0.25,
            max: 500,
            default: 2,
        },
        dueDate: {
            type: Date,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        dependsOn: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
        }],
    },
    {timestamps: true}
);

taskSchema.index({ user: 1, project: 1, status: 1, dueDate: 1 });
taskSchema.index({ project: 1, status: 1, dueDate: 1 });
taskSchema.index({ dependsOn: 1 });

export default mongoose.model("Task", taskSchema);