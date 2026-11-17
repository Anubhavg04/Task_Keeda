import mongoose from 'mongoose';
import DiscussionMessage from '../models/DiscussionMessage.models.js';
import DiscussionReadState from '../models/DiscussionReadState.models.js';
import InAppNotification from '../models/InAppNotification.models.js';
import Project from '../models/Project.models.js';
import Task from '../models/Task.models.js';
import { getAccessibleProject } from './projectController.js';

const pageSize = 50;
const maximumMessageLength = 2000;
const projectAccess = (userId) => ({
  $or: [{ owner: userId }, { members: userId }],
});

export const getDiscussionSummaries = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const projects = await Project.find(projectAccess(userId)).select('_id name').lean();
    if (!projects.length) return res.json([]);

    const projectIds = projects.map((project) => project._id);
    const readStates = await DiscussionReadState.find({
      user: userId,
      project: { $in: projectIds },
    }).select('project lastReadMessage').lean();
    const readByProject = new Map(readStates.map((state) => [String(state.project), state.lastReadMessage]));
    const unreadFilters = projects.map((project) => {
      const lastReadMessage = readByProject.get(String(project._id));
      return {
        project: project._id,
        task: null,
        author: { $ne: userId },
        ...(lastReadMessage ? { _id: { $gt: lastReadMessage } } : {}),
      };
    });

    const [latestMessages, unreadCounts] = await Promise.all([
      DiscussionMessage.aggregate([
        { $match: { project: { $in: projectIds }, task: null } },
        { $sort: { _id: -1 } },
        {
          $group: {
            _id: '$project',
            content: { $first: '$content' },
            createdAt: { $first: '$createdAt' },
          },
        },
      ]),
      DiscussionMessage.aggregate([
        { $match: { $or: unreadFilters } },
        { $group: { _id: '$project', count: { $sum: 1 } } },
      ]),
    ]);

    const latestByProject = new Map(latestMessages.map((message) => [String(message._id), message]));
    const unreadByProject = new Map(unreadCounts.map((entry) => [String(entry._id), entry.count]));
    res.json(projects.map((project) => {
      const latest = latestByProject.get(String(project._id));
      return {
        projectId: project._id,
        projectName: project.name,
        lastMessage: latest ? { content: latest.content, createdAt: latest.createdAt } : null,
        unreadCount: unreadByProject.get(String(project._id)) || 0,
      };
    }));
  } catch (error) {
    console.error('Failed to fetch discussion summaries:', error);
    res.status(500).json({ message: 'Failed to fetch discussion summaries' });
  }
};

export const markDiscussionRead = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }
  if (!mongoose.isValidObjectId(req.body.lastMessageId)) {
    return res.status(400).json({ message: 'A valid last message id is required' });
  }

  try {
    const project = await getAccessibleProject(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ message: 'Discussion not found or you do not have access' });
    }

    const lastMessage = await DiscussionMessage.findOne({
      _id: req.body.lastMessageId,
      project: project._id,
      task: null,
    }).select('_id').lean();
    if (!lastMessage) return res.status(404).json({ message: 'Workspace chat message not found' });

    await DiscussionReadState.findOneAndUpdate(
      { project: project._id, user: req.user.id },
      {
        $setOnInsert: { project: project._id, user: req.user.id },
        $max: { lastReadMessage: lastMessage._id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: false, runValidators: true }
    );
    res.json({ lastReadMessageId: lastMessage._id });
  } catch (error) {
    console.error('Failed to mark discussion as read:', error);
    res.status(500).json({ message: 'Failed to mark discussion as read' });
  }
};

const getDiscussionContext = async ({ projectId, userId, taskId }) => {
  const project = await getAccessibleProject(projectId, userId);
  if (!project) return null;

  if (!taskId) {
    return { project, task: null, filter: { project: project._id, task: null } };
  }

  if (!mongoose.isValidObjectId(taskId)) return null;
  const task = await Task.findOne({
    _id: taskId,
    project: project._id,
    isDeleted: { $ne: true },
  }).select('_id').lean();
  if (!task) return null;

  return { project, task, filter: { task: task._id } };
};

export const getDiscussionMessages = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }
  if (req.query.taskId !== undefined && typeof req.query.taskId !== 'string') {
    return res.status(400).json({ message: 'Invalid task id' });
  }
  if (req.query.taskId && !mongoose.isValidObjectId(req.query.taskId)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }
  if (req.query.before !== undefined && !mongoose.isValidObjectId(req.query.before)) {
    return res.status(400).json({ message: 'Invalid message cursor' });
  }

  try {
    const context = await getDiscussionContext({
      projectId: req.params.id,
      userId: req.user.id,
      taskId: req.query.taskId,
    });
    if (!context) {
      return res.status(404).json({ message: 'Discussion not found or you do not have access' });
    }

    const filter = { ...context.filter };
    if (req.query.before) filter._id = { $lt: new mongoose.Types.ObjectId(req.query.before) };
    const messages = await DiscussionMessage.find(filter)
      .populate('author', 'fullname')
      .sort({ _id: -1 })
      .limit(pageSize + 1)
      .lean();

    const hasMore = messages.length > pageSize;
    const page = messages.slice(0, pageSize).reverse();
    res.json({
      messages: page,
      hasMore,
      nextCursor: hasMore ? String(page[0]._id) : null,
    });
  } catch (error) {
    console.error('Failed to fetch discussion messages:', error);
    res.status(500).json({ message: 'Failed to fetch discussion messages' });
  }
};

export const createDiscussionMessage = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }
  if (req.body.taskId !== undefined && req.body.taskId !== null &&
      req.body.taskId !== '' && typeof req.body.taskId !== 'string') {
    return res.status(400).json({ message: 'Invalid task id' });
  }
  if (req.body.taskId && !mongoose.isValidObjectId(req.body.taskId)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }

  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content || content.length > maximumMessageLength) {
    return res.status(400).json({ message: `Message must be between 1 and ${maximumMessageLength} characters` });
  }
  const mentionedIds = req.body.mentions === undefined ? [] : req.body.mentions;
  if (
    !Array.isArray(mentionedIds) ||
    mentionedIds.length > 20 ||
    mentionedIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id)) ||
    new Set(mentionedIds.map((id) => id.toLowerCase())).size !== mentionedIds.length
  ) {
    return res.status(400).json({ message: 'Choose up to 20 unique valid teammates to mention' });
  }

  try {
    const context = await getDiscussionContext({
      projectId: req.params.id,
      userId: req.user.id,
      taskId: req.body.taskId || undefined,
    });
    if (!context) {
      return res.status(404).json({ message: 'Discussion not found or you do not have access' });
    }
    const participants = [context.project.owner, ...context.project.members];
    const participantIds = new Set(participants.map((memberId) => String(memberId).toLowerCase()));
    const normalizedMentionIds = mentionedIds.map((id) => id.toLowerCase());
    if (normalizedMentionIds.some((id) => (
      !participantIds.has(id) || id === String(req.user.id).toLowerCase()
    ))) {
      return res.status(400).json({ message: 'You can only mention other members of this workspace' });
    }

    const message = await DiscussionMessage.create({
      project: context.task ? null : context.project._id,
      task: context.task?._id || null,
      author: req.user.id,
      content,
      mentions: normalizedMentionIds,
    });
    await message.populate('author', 'fullname');
    const recipientIds = [...new Set(participants.map((memberId) => String(memberId)))]
      .filter((memberId) => memberId !== String(req.user.id));
    let notificationWarning = '';
    if (recipientIds.length) {
      try {
        await InAppNotification.insertMany(recipientIds.map((recipient) => ({
          recipient,
          project: context.project._id,
          task: context.task?._id || null,
          message: message._id,
          actor: req.user.id,
          kind: normalizedMentionIds.includes(recipient.toLowerCase()) ? 'mention' : 'discussion',
          excerpt: content.slice(0, 240),
        })));
      } catch (error) {
        console.error('Discussion message was saved, but in-app notifications failed:', error);
        notificationWarning = 'Message sent, but teammate notifications could not be created.';
      }
    }
    res.status(201).json({ ...message.toObject(), notificationWarning });
  } catch (error) {
    console.error('Failed to create discussion message:', error);
    res.status(500).json({ message: 'Failed to create discussion message' });
  }
};

export const updateDiscussionMessage = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.messageId)) {
    return res.status(400).json({ message: 'Invalid project or message id' });
  }

  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content || content.length > maximumMessageLength) {
    return res.status(400).json({ message: `Message must be between 1 and ${maximumMessageLength} characters` });
  }

  try {
    const project = await getAccessibleProject(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ message: 'Discussion not found or you do not have access' });
    }

    const message = await DiscussionMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.task) {
      const task = await Task.findOne({ _id: message.task, project: project._id }).select('_id').lean();
      if (!task) return res.status(404).json({ message: 'Message not found' });
    } else if (!message.project?.equals(project._id)) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (!message.author.equals(req.user.id)) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    message.content = content;
    await message.save();
    await message.populate('author', 'fullname');
    res.json(message);
  } catch (error) {
    console.error('Failed to update discussion message:', error);
    res.status(500).json({ message: 'Failed to update discussion message' });
  }
};

export const deleteDiscussionMessage = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.messageId)) {
    return res.status(400).json({ message: 'Invalid project or message id' });
  }

  try {
    const project = await getAccessibleProject(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ message: 'Discussion not found or you do not have access' });
    }

    const message = await DiscussionMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.task) {
      const task = await Task.findOne({ _id: message.task, project: project._id }).select('_id').lean();
      if (!task) return res.status(404).json({ message: 'Message not found' });
    } else if (!message.project?.equals(project._id)) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.author.equals(req.user.id) && !project.owner.equals(req.user.id)) {
      return res.status(403).json({ message: 'Only the author or workspace owner can delete this message' });
    }

    await message.deleteOne();
    await InAppNotification.deleteMany({ message: message._id });
    res.json({ message: 'Discussion message deleted' });
  } catch (error) {
    console.error('Failed to delete discussion message:', error);
    res.status(500).json({ message: 'Failed to delete discussion message' });
  }
};
