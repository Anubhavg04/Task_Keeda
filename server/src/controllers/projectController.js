import mongoose from 'mongoose';
import Project from '../models/Project.models.js';
import DiscussionMessage from '../models/DiscussionMessage.models.js';
import DiscussionReadState from '../models/DiscussionReadState.models.js';
import InAppNotification from '../models/InAppNotification.models.js';
import Note from '../models/Note.models.js';
import Task from '../models/Task.models.js';
import User from '../models/User.models.js';
import { sendPushToUser } from '../services/pushNotifications.js';

const projectAccess = (userId) => ({
  $or: [{ owner: userId }, { members: userId }],
});

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find(projectAccess(req.user.id))
      .populate('owner', 'fullname email')
      .populate('members', 'fullname email')
      .sort({ updatedAt: -1 });

    const projectIds = projects.map((project) => project._id);
    const taskSummaries = projectIds.length ? await Task.aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$project',
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'done'] }, { $eq: ['$priority', 'low'] }] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'done'] }, { $eq: ['$priority', 'medium'] }] }, 1, 0] } },
          high: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'done'] }, { $eq: ['$priority', 'high'] }] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'done'] }, { $eq: ['$priority', 'urgent'] }] }, 1, 0] } },
        },
      },
    ]) : [];
    const summaryByProject = new Map(taskSummaries.map((summary) => [String(summary._id), summary]));
    const emptySummary = { total: 0, todo: 0, inProgress: 0, done: 0, low: 0, medium: 0, high: 0, urgent: 0 };

    res.json(projects.map((project) => ({
      ...project.toObject(),
      taskSummary: summaryByProject.get(String(project._id)) || emptySummary,
    })));
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const createProject = async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const color = req.body.color || 'orange';

  if (!name) {
    return res.status(400).json({ message: 'Project name is required' });
  }
  if (name.length > 100 || description.length > 1000) {
    return res.status(400).json({ message: 'Project name or description is too long' });
  }
  if (!['orange', 'violet', 'blue', 'emerald', 'amber', 'rose'].includes(color)) {
    return res.status(400).json({ message: 'Invalid project color' });
  }

  try {
    const project = await Project.create({
      name,
      description,
      color,
      owner: req.user.id,
    });

    await project.populate('owner', 'fullname email');
    res.status(201).json(project);
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

export const addProjectMember = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254) {
    return res.status(400).json({ message: 'A valid member email is required' });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }

  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or you are not the owner' });
    }

    const member = await User.findOne({ email }).select('fullname email');
    if (!member) {
      return res.status(404).json({ message: 'No registered account found for that email' });
    }
    if (member._id.equals(project.owner)) {
      return res.status(400).json({ message: 'The project owner is already a member' });
    }
    if (project.members.some((id) => id.equals(member._id))) {
      return res.status(409).json({ message: 'This person is already a project member' });
    }

    project.members.push(member._id);
    await project.save();
    sendPushToUser(member._id, {
      title: 'Added to a team workspace',
      body: 'Open TaskFlow to see your shared workspace.',
      url: '/projects',
    }).catch((error) => console.error('Could not send team workspace notification:', error));
    await project.populate('owner', 'fullname email');
    await project.populate('members', 'fullname email');
    res.status(200).json(project);
  } catch (error) {
    console.error('Failed to add project member:', error);
    res.status(500).json({ message: 'Failed to add project member' });
  }
};

export const removeProjectMember = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.memberId)) {
    return res.status(400).json({ message: 'Invalid project or member id' });
  }

  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or you are not the owner' });
    }

    project.members = project.members.filter((member) => !member.equals(req.params.memberId));
    await project.save();
    await Task.updateMany(
      { project: project._id, assignee: req.params.memberId },
      { $set: { assignee: null } }
    );
    await InAppNotification.deleteMany({ project: project._id, recipient: req.params.memberId });
    await project.populate('owner', 'fullname email');
    await project.populate('members', 'fullname email');
    res.json(project);
  } catch (error) {
    console.error('Failed to remove project member:', error);
    res.status(500).json({ message: 'Failed to remove project member' });
  }
};

export const deleteProject = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }

  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or you are not the owner' });
    }

    const taskIds = await Task.find({ project: project._id }).distinct('_id');
    await Promise.all([
      Task.updateMany({ project: project._id }, { $set: { project: null, assignee: null, dependsOn: [] } }),
      Note.updateMany({ project: project._id }, { $set: { project: null } }),
      DiscussionMessage.deleteMany({
        $or: [
          { project: project._id },
          { task: { $in: taskIds } },
        ],
      }),
      DiscussionReadState.deleteMany({ project: project._id }),
      InAppNotification.deleteMany({ project: project._id }),
    ]);
    await project.deleteOne();

    res.json({ message: 'Project deleted. Tasks and notes are now private to their creators.' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

export const getAccessibleProject = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    return null;
  }
  return Project.findOne({ _id: projectId, ...projectAccess(userId) });
};
