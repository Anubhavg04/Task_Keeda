import mongoose from 'mongoose';
import Project from '../models/Project.models.js';
import Task from '../models/Task.models.js';
import User from '../models/User.models.js';
import { sendPushToUser } from '../services/pushNotifications.js';
import { getAccessibleProject } from './projectController.js';

const taskStatuses = ['todo', 'in-progress', 'done'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const sortFields = ['createdAt', 'dueDate', 'title', 'status', 'updatedAt'];
const maximumDependencies = 20;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const accessibleTasks = async (userId, projectId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  if (projectId === 'personal') {
    return { user: userObjectId, project: null };
  }
  if (projectId) {
    if (!mongoose.isValidObjectId(projectId)) {
      return null;
    }
    const project = await getAccessibleProject(projectId, userId);
    return project ? { project: project._id } : null;
  }

  const projectIds = await Project.find({ $or: [{ owner: userObjectId }, { members: userObjectId }] })
    .distinct('_id');
  return {
    $or: [
      { user: userObjectId, project: null },
      { project: { $in: projectIds } },
    ],
  };
};

const validateTask = (body, isCreate = false) => {
  if (isCreate && (typeof body.title !== 'string' || !body.title.trim())) {
    return 'Task title is required';
  }
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200)) {
    return 'Task title must be between 1 and 200 characters';
  }
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 5000)) {
    return 'Task description must be 5000 characters or fewer';
  }
  if (body.status !== undefined && !taskStatuses.includes(body.status)) {
    return 'Invalid task status';
  }
  if (body.priority !== undefined && !priorities.includes(body.priority)) {
    return 'Invalid task priority';
  }
  if (body.estimatedHours !== undefined &&
      (typeof body.estimatedHours !== 'number' || !Number.isFinite(body.estimatedHours) ||
       body.estimatedHours < 0.25 || body.estimatedHours > 500)) {
    return 'Estimated effort must be between 0.25 and 500 hours';
  }
  if (body.dependsOn !== undefined &&
      (!Array.isArray(body.dependsOn) ||
       body.dependsOn.length > maximumDependencies ||
       body.dependsOn.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id)) ||
       new Set(body.dependsOn.map((id) => id.toLowerCase())).size !== body.dependsOn.length)) {
    return `Choose up to ${maximumDependencies} unique valid task dependencies`;
  }
  if (body.dueDate && Number.isNaN(Date.parse(body.dueDate))) {
    return 'Invalid due date';
  }
  return null;
};

const dependencyScope = (userId, projectId) => (
  projectId ? { project: projectId } : { user: userId, project: null }
);

const validateDependencies = async ({ dependencyIds, taskId, userId, projectId }) => {
  if (!dependencyIds?.length) return null;
  const taskIdString = taskId ? String(taskId).toLowerCase() : '';
  if (taskIdString && dependencyIds.some((id) => id.toLowerCase() === taskIdString)) {
    return 'A task cannot depend on itself';
  }

  const scope = dependencyScope(userId, projectId);
  const dependencies = await Task.find({ ...scope, _id: { $in: dependencyIds } }).select('_id dependsOn').lean();
  if (dependencies.length !== dependencyIds.length) {
    return 'Dependencies must be tasks in the same workspace that you can access';
  }

  if (!taskId) return null;

  const visited = new Set();
  let frontier = dependencyIds.map((id) => String(id).toLowerCase());
  let inspected = 0;
  while (frontier.length) {
    if (frontier.includes(taskIdString)) return 'This dependency would create a circular task chain';
    const unseen = frontier.filter((id) => !visited.has(id));
    if (!unseen.length) break;
    unseen.forEach((id) => visited.add(id));
    inspected += unseen.length;
    if (inspected > 5000) return 'This dependency chain is too large to validate safely';
    const ancestors = await Task.find({ ...scope, _id: { $in: unseen } }).select('dependsOn').lean();
    frontier = ancestors.flatMap((task) => (task.dependsOn || []).map((id) => String(id).toLowerCase()));
  }
  return null;
};

export const getTaskSummary = async (req, res) => {
  try {
    const taskFilter = await accessibleTasks(req.user.id);
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
    const nextWeek = new Date(startOfToday);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - ((startOfWeek.getUTCDay() + 6) % 7));

    const [total, todo, inProgress, done, overdue, dueToday, dueThisWeek, completedThisWeek, projects] =
      await Promise.all([
        Task.countDocuments(taskFilter),
        Task.countDocuments({ ...taskFilter, status: 'todo' }),
        Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
        Task.countDocuments({ ...taskFilter, status: 'done' }),
        Task.countDocuments({ ...taskFilter, status: { $ne: 'done' }, dueDate: { $lt: startOfToday } }),
        Task.countDocuments({ ...taskFilter, status: { $ne: 'done' }, dueDate: { $gte: startOfToday, $lt: startOfTomorrow } }),
        Task.countDocuments({ ...taskFilter, status: { $ne: 'done' }, dueDate: { $gte: startOfToday, $lt: nextWeek } }),
        Task.countDocuments({
          $and: [
            taskFilter,
            { status: 'done' },
            {
              $or: [
                { completedAt: { $gte: startOfWeek } },
                { completedAt: { $exists: false }, updatedAt: { $gte: startOfWeek } },
              ],
            },
          ],
        }),
        Project.countDocuments({ $or: [{ owner: req.user.id }, { members: req.user.id }] }),
      ]);

    const [lowPriority, mediumPriority, highPriority, urgentPriority, byProject] = await Promise.all([
      Task.countDocuments({ ...taskFilter, status: { $ne: 'done' }, priority: 'low' }),
      Task.countDocuments({
        $and: [
          taskFilter,
          { status: { $ne: 'done' } },
          { $or: [{ priority: 'medium' }, { priority: { $exists: false } }] },
        ],
      }),
      Task.countDocuments({ ...taskFilter, status: { $ne: 'done' }, priority: 'high' }),
      Task.countDocuments({ ...taskFilter, status: { $ne: 'done' }, priority: 'urgent' }),
      Task.aggregate([
        { $match: taskFilter },
        {
          $group: {
            _id: '$project',
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'projectInfo',
          },
        },
        { $unwind: { path: '$projectInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            name: { $ifNull: ['$projectInfo.name', 'Personal tasks'] },
            total: 1,
            done: 1,
          },
        },
      ]),
    ]);

    res.json({
      total, todo, inProgress, done, overdue, dueToday, dueThisWeek, completedThisWeek, projects,
      priorities: { low: lowPriority, medium: mediumPriority, high: highPriority, urgent: urgentPriority },
      byProject,
    });
  } catch (error) {
    console.error('Failed to fetch task summary:', error);
    res.status(500).json({ message: 'Failed to fetch workspace summary' });
  }
};

export const createTask = async (req, res) => {
  const validationError = validateTask(req.body, true);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    let project = null;
    if (req.body.projectId) {
      project = await getAccessibleProject(req.body.projectId, req.user.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found or you do not have access' });
      }
    }
    let assignee = null;
    if (req.body.assigneeId) {
      if (!mongoose.isValidObjectId(req.body.assigneeId) || !project) {
        return res.status(400).json({ message: 'Tasks can only be assigned to members of a project' });
      }
      const isMember = project.owner.equals(req.body.assigneeId) ||
        project.members.some((memberId) => memberId.equals(req.body.assigneeId));
      if (!isMember) {
        return res.status(400).json({ message: 'The assignee must be a member of this project' });
      }
      assignee = req.body.assigneeId;
    }
    const dependencyIds = req.body.dependsOn || [];
    const dependencyError = await validateDependencies({
      dependencyIds,
      userId: req.user.id,
      projectId: project?._id,
    });
    if (dependencyError) return res.status(400).json({ message: dependencyError });
    if ((req.body.status || 'todo') === 'done' && dependencyIds.length) {
      const incompleteDependencies = await Task.countDocuments({
        ...dependencyScope(req.user.id, project?._id),
        _id: { $in: dependencyIds },
        status: { $ne: 'done' },
      });
      if (incompleteDependencies) {
        return res.status(409).json({ message: 'Complete prerequisite tasks before completing this task' });
      }
    }

    const task = await Task.create({
      title: req.body.title.trim(),
      description: req.body.description?.trim() || '',
      status: req.body.status || 'todo',
      priority: req.body.priority || 'medium',
      estimatedHours: req.body.estimatedHours ?? 2,
      dueDate: req.body.dueDate || null,
      completedAt: (req.body.status || 'todo') === 'done' ? new Date() : null,
      project: project?._id || null,
      assignee,
      dependsOn: dependencyIds,
      user: req.user.id,
    });

    await task.populate('project', 'name color');
    await task.populate('assignee', 'fullname email');
    await task.populate({ path: 'dependsOn', select: 'title status', match: dependencyScope(req.user.id, task.project) });
    if (assignee && String(assignee) !== String(req.user.id)) {
      sendPushToUser(assignee, {
        title: 'New task assigned',
        body: 'Open TaskFlow to see the task details.',
        url: '/tasks',
      }).catch((error) => console.error('Could not send task assignment notification:', error));
    }
    res.status(201).json(task);
  } catch (error) {
    console.error('Failed to create task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

export const getTasks = async (req, res) => {
  const status = req.query.status;
  if (status && !taskStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid task status' });
  }
  const priority = req.query.priority;
  if (priority && !priorities.includes(priority)) {
    return res.status(400).json({ message: 'Invalid task priority' });
  }

  const sortBy = sortFields.includes(req.query.sort) ? req.query.sort : 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const pageNumber = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';

  try {
    const scopeFilter = await accessibleTasks(req.user.id, req.query.projectId);
    if (!scopeFilter) {
      return res.status(404).json({ message: 'Project not found or you do not have access' });
    }
    const taskFilter = { ...scopeFilter };

    if (status) taskFilter.status = status;
    if (priority) taskFilter.priority = priority;
    if ((req.query.from && Number.isNaN(Date.parse(req.query.from))) ||
        (req.query.to && Number.isNaN(Date.parse(req.query.to)))) {
      return res.status(400).json({ message: 'Invalid due date range' });
    }
    if (req.query.from || req.query.to) {
      const dateFilter = {};
      if (req.query.from && !Number.isNaN(Date.parse(req.query.from))) {
        dateFilter.$gte = new Date(req.query.from);
      }
      if (req.query.to && !Number.isNaN(Date.parse(req.query.to))) {
        dateFilter.$lt = new Date(req.query.to);
      }
      if (Object.keys(dateFilter).length) taskFilter.dueDate = dateFilter;
    }
    if (search) {
      const expression = new RegExp(escapeRegex(search), 'i');
      taskFilter.$and = [{ $or: [{ title: expression }, { description: expression }] }];
    }

    const skip = (pageNumber - 1) * limitNumber;
    const [tasks, totalTasks] = await Promise.all([
      Task.find(taskFilter)
        .populate('project', 'name color')
        .populate('assignee', 'fullname email')
        .sort({ [sortBy]: order, _id: 1 })
        .skip(skip)
        .limit(limitNumber),
      Task.countDocuments(taskFilter),
    ]);
    const taskIds = tasks.map((task) => task._id);
    const blockingRows = taskIds.length
      ? await Task.aggregate([
        { $match: { ...scopeFilter, status: { $ne: 'done' }, dependsOn: { $in: taskIds } } },
        { $unwind: '$dependsOn' },
        { $match: { dependsOn: { $in: taskIds } } },
        { $group: { _id: '$dependsOn', count: { $sum: 1 } } },
      ])
      : [];
    const blockingCounts = new Map(blockingRows.map((row) => [String(row._id), row.count]));
    await Task.populate(tasks, { path: 'dependsOn', select: 'title status', match: scopeFilter });

    res.json({
      tasks: tasks.map((task) => ({
        ...task.toObject(),
        blockingTaskCount: blockingCounts.get(String(task._id)) || 0,
      })),
      pagination: {
        totalTasks,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalTasks / limitNumber),
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

export const updateTask = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }

  const validationError = validateTask(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const previousAssigneeId = task.assignee ? String(task.assignee) : null;

    let taskProject = null;
    if (task.project) {
      taskProject = await getAccessibleProject(task.project, req.user.id);
      if (!taskProject) {
        return res.status(404).json({ message: 'Task not found' });
      }
    } else if (!task.user.equals(req.user.id)) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.body.title !== undefined) task.title = req.body.title.trim();
    if (req.body.description !== undefined) task.description = req.body.description.trim();
    if (req.body.status !== undefined) {
      if (req.body.status === 'done' && task.status !== 'done') task.completedAt = new Date();
      if (req.body.status !== 'done') task.completedAt = null;
      task.status = req.body.status;
    }
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.estimatedHours !== undefined) task.estimatedHours = req.body.estimatedHours;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate || null;

    if (req.body.projectId !== undefined) {
      const currentProjectId = task.project ? String(task.project) : '';
      const nextProjectId = req.body.projectId ? String(req.body.projectId) : '';
      if (currentProjectId && currentProjectId !== nextProjectId && !taskProject.owner.equals(req.user.id)) {
        return res.status(403).json({ message: 'Only the project owner can move a task to another workspace' });
      }
      if (currentProjectId !== nextProjectId) {
        const hasDependents = await Task.exists({ dependsOn: task._id });
        if ((task.dependsOn?.length || hasDependents) && req.body.dependsOn === undefined) {
          return res.status(409).json({ message: 'Remove this task’s dependency links before moving it to another workspace' });
        }
        if (hasDependents) {
          return res.status(409).json({ message: 'Remove other tasks’ dependency links before moving this task' });
        }
        task.dependsOn = [];
      }

      if (req.body.projectId) {
        taskProject = await getAccessibleProject(req.body.projectId, req.user.id);
        if (!taskProject) {
          return res.status(404).json({ message: 'Project not found or you do not have access' });
        }
        task.project = taskProject._id;
      } else {
        taskProject = null;
        task.project = null;
        task.assignee = null;
      }
    }

    if (req.body.dependsOn !== undefined) {
      const dependencyError = await validateDependencies({
        dependencyIds: req.body.dependsOn,
        taskId: task._id,
        userId: req.user.id,
        projectId: task.project,
      });
      if (dependencyError) return res.status(400).json({ message: dependencyError });
      task.dependsOn = req.body.dependsOn;
    }
    const dependencies = task.dependsOn || [];
    if (task.status === 'done' && dependencies.length) {
      const incompleteDependencies = await Task.countDocuments({
        ...dependencyScope(req.user.id, task.project),
        _id: { $in: dependencies },
        status: { $ne: 'done' },
      });
      if (incompleteDependencies) {
        return res.status(409).json({ message: 'Complete prerequisite tasks before completing this task' });
      }
    }

    if (req.body.assigneeId !== undefined) {
      if (!req.body.assigneeId) {
        task.assignee = null;
      } else {
        if (!mongoose.isValidObjectId(req.body.assigneeId) || !taskProject) {
          return res.status(400).json({ message: 'Tasks can only be assigned to members of a project' });
        }
        const isMember = taskProject.owner.equals(req.body.assigneeId) ||
          taskProject.members.some((memberId) => memberId.equals(req.body.assigneeId));
        if (!isMember) {
          return res.status(400).json({ message: 'The assignee must be a member of this project' });
        }
        task.assignee = req.body.assigneeId;
      }
    } else if (req.body.projectId !== undefined && task.assignee) {
      const assigneeIsMember = taskProject && (
        taskProject.owner.equals(task.assignee) ||
        taskProject.members.some((memberId) => memberId.equals(task.assignee))
      );
      if (!assigneeIsMember) task.assignee = null;
    }

    await task.save();
    const nextAssigneeId = task.assignee ? String(task.assignee) : null;
    if (nextAssigneeId && nextAssigneeId !== previousAssigneeId && nextAssigneeId !== String(req.user.id)) {
      sendPushToUser(nextAssigneeId, {
        title: 'New task assigned',
        body: 'Open TaskFlow to see the task details.',
        url: '/tasks',
      }).catch((error) => console.error('Could not send task assignment notification:', error));
    }
    await task.populate('project', 'name color');
    await task.populate('assignee', 'fullname email');
    await task.populate({ path: 'dependsOn', select: 'title status', match: dependencyScope(task.user, task.project) });
    res.json(task);
  } catch (error) {
    console.error('Failed to update task:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

export const getDeliveryControlTower = async (req, res) => {
  try {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const taskFilter = await accessibleTasks(req.user.id, projectId);
    if (!taskFilter) {
      return res.status(404).json({ message: 'Project not found or you do not have access' });
    }
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const nextWeek = new Date(today);
    nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
    const historyStart = new Date(now);
    historyStart.setUTCDate(historyStart.getUTCDate() - 14);

    const taskPipeline = [
      { $match: taskFilter },
      { $addFields: { estimatedHours: { $ifNull: ['$estimatedHours', 2] } } },
      {
        $facet: {
          projects: [
            {
              $group: {
                _id: '$project',
                totalTasks: { $sum: 1 },
                openTasks: { $sum: { $cond: [{ $ne: ['$status', 'done'] }, 1, 0] } },
                remainingHours: { $sum: { $cond: [{ $ne: ['$status', 'done'] }, '$estimatedHours', 0] } },
                overdueTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$status', 'done'] },
                          { $ne: [{ $ifNull: ['$dueDate', null] }, null] },
                          { $lt: ['$dueDate', today] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                dueSoonTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$status', 'done'] },
                          { $gte: ['$dueDate', today] },
                          { $lt: ['$dueDate', nextWeek] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                highPriorityTasks: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ne: ['$status', 'done'] }, { $in: ['$priority', ['high', 'urgent']] }] },
                      1,
                      0,
                    ],
                  },
                },
                unassignedTasks: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ne: ['$status', 'done'] }, { $eq: [{ $ifNull: ['$assignee', null] }, null] }] },
                      1,
                      0,
                    ],
                  },
                },
                completedHoursLast14Days: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$status', 'done'] },
                          { $gte: [{ $ifNull: ['$completedAt', '$updatedAt'] }, historyStart] },
                        ],
                      },
                      '$estimatedHours',
                      0,
                    ],
                  },
                },
                targetDate: {
                  $max: { $cond: [{ $ne: ['$status', 'done'] }, '$dueDate', null] },
                },
              },
            },
            { $sort: { remainingHours: -1, _id: 1 } },
          ],
          team: [
            { $match: { status: { $ne: 'done' } } },
            {
              $group: {
                _id: '$assignee',
                openTasks: { $sum: 1 },
                remainingHours: { $sum: '$estimatedHours' },
                overdueTasks: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ne: [{ $ifNull: ['$dueDate', null] }, null] }, { $lt: ['$dueDate', today] }] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { remainingHours: -1, _id: 1 } },
          ],
          riskTasks: [
            { $match: { status: { $ne: 'done' } } },
            {
              $match: {
                $or: [
                  { dueDate: { $lt: nextWeek, $ne: null } },
                  { priority: { $in: ['high', 'urgent'] } },
                  { assignee: null },
                ],
              },
            },
            {
              $addFields: {
                riskDueSort: { $ifNull: ['$dueDate', new Date('9999-12-31T00:00:00.000Z')] },
                riskPrioritySort: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$priority', 'urgent'] }, then: 0 },
                      { case: { $eq: ['$priority', 'high'] }, then: 1 },
                    ],
                    default: 2,
                  },
                },
              },
            },
            { $sort: { riskDueSort: 1, riskPrioritySort: 1, updatedAt: -1 } },
            { $limit: 12 },
            {
              $lookup: {
                from: 'projects',
                localField: 'project',
                foreignField: '_id',
                as: 'projectInfo',
              },
            },
            { $unwind: { path: '$projectInfo', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'users',
                localField: 'assignee',
                foreignField: '_id',
                as: 'assigneeInfo',
              },
            },
            { $unwind: { path: '$assigneeInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                title: 1,
                _id: 1,
                status: 1,
                priority: 1,
                dueDate: 1,
                estimatedHours: 1,
                project: { $ifNull: ['$projectInfo.name', 'Personal work'] },
                projectId: { $ifNull: ['$project', null] },
                assignee: { $ifNull: ['$assigneeInfo.fullname', null] },
              },
            },
          ],
        },
      },
    ];

    const [result] = await Task.aggregate(taskPipeline);
    const dependencyTasks = await Task.find(taskFilter)
      .select('_id title status estimatedHours dependsOn project dueDate priority assignee')
      .populate('project', 'name color')
      .populate('assignee', 'fullname')
      .lean();
    const dependencyTaskById = new Map(dependencyTasks.map((task) => [String(task._id), task]));
    const dependencyStateById = new Map();
    const dependencyMetricsByProject = new Map();
    const longestPathMemo = new Map();

    for (const task of dependencyTasks) {
      const projectKey = task.project ? String(task.project._id) : 'personal';
      if (!dependencyMetricsByProject.has(projectKey)) {
        dependencyMetricsByProject.set(projectKey, { blockedTasks: 0, criticalPathHours: 0 });
      }
      dependencyStateById.set(String(task._id), { blockedByCount: 0, blockingCount: 0 });
    }

    for (const task of dependencyTasks) {
      const incompleteDependencies = (task.dependsOn || [])
        .map((dependencyId) => dependencyTaskById.get(String(dependencyId)))
        .filter((dependency) => dependency && dependency.status !== 'done');
      const state = dependencyStateById.get(String(task._id));
      state.blockedByCount = task.status === 'done' ? 0 : incompleteDependencies.length;
      if (task.status !== 'done' && incompleteDependencies.length) {
        const projectKey = task.project ? String(task.project._id) : 'personal';
        dependencyMetricsByProject.get(projectKey).blockedTasks += 1;
      }
      for (const dependency of incompleteDependencies) {
        dependencyStateById.get(String(dependency._id)).blockingCount += 1;
      }
    }

    const longestOpenPathHours = (task, visiting = new Set()) => {
      const id = String(task._id);
      if (longestPathMemo.has(id)) return longestPathMemo.get(id);
      if (visiting.has(id) || task.status === 'done') return 0;
      visiting.add(id);
      const prerequisites = (task.dependsOn || [])
        .map((dependencyId) => dependencyTaskById.get(String(dependencyId)))
        .filter((dependency) => dependency && dependency.status !== 'done');
      const predecessorHours = Math.max(0, ...prerequisites.map((dependency) => longestOpenPathHours(dependency, visiting)));
      visiting.delete(id);
      const pathHours = predecessorHours + (task.estimatedHours ?? 2);
      longestPathMemo.set(id, pathHours);
      return pathHours;
    };

    for (const task of dependencyTasks) {
      if (task.status === 'done') continue;
      const projectKey = task.project ? String(task.project._id) : 'personal';
      const metrics = dependencyMetricsByProject.get(projectKey);
      metrics.criticalPathHours = Math.max(metrics.criticalPathHours, longestOpenPathHours(task));
    }

    const projectIds = result.projects.map((project) => project._id).filter(Boolean);
    const assigneeIds = result.team.map((member) => member._id).filter(Boolean);
    const [projects, users] = await Promise.all([
      Project.find({ _id: { $in: projectIds } }).select('name color').lean(),
      User.find({ _id: { $in: assigneeIds } }).select('fullname').lean(),
    ]);
    const projectNames = new Map(projects.map((project) => [String(project._id), project]));
    const memberNames = new Map(users.map((user) => [String(user._id), user.fullname]));

    const projectRows = result.projects.map((project) => {
      const openTasks = project.openTasks;
      const dependencyMetrics = dependencyMetricsByProject.get(project._id ? String(project._id) : 'personal') ||
        { blockedTasks: 0, criticalPathHours: 0 };
      const riskScore = openTasks
        ? Math.min(100, Math.round(
          (project.overdueTasks / openTasks) * 40 +
          (project.dueSoonTasks / openTasks) * 20 +
          (project.highPriorityTasks / openTasks) * 15 +
          (project.unassignedTasks / openTasks) * 10 +
          (dependencyMetrics.blockedTasks / openTasks) * 15
        ))
        : 0;
      const dailyVelocity = project.completedHoursLast14Days / 14;
      const projectedFinish = openTasks === 0
        ? now
        : dailyVelocity > 0
          ? new Date(now.getTime() + Math.ceil(project.remainingHours / dailyVelocity) * 86400000)
          : null;
      const projectInfo = project._id ? projectNames.get(String(project._id)) : null;

      return {
        id: project._id ? String(project._id) : 'personal',
        name: projectInfo?.name || 'Personal work',
        color: projectInfo?.color || 'orange',
        totalTasks: project.totalTasks,
        openTasks,
        remainingHours: Math.round(project.remainingHours * 10) / 10,
        overdueTasks: project.overdueTasks,
        dueSoonTasks: project.dueSoonTasks,
        highPriorityTasks: project.highPriorityTasks,
        unassignedTasks: project.unassignedTasks,
        blockedTasks: dependencyMetrics.blockedTasks,
        criticalPathHours: Math.round(dependencyMetrics.criticalPathHours * 10) / 10,
        completedHoursLast14Days: Math.round(project.completedHoursLast14Days * 10) / 10,
        targetDate: project.targetDate,
        projectedFinish,
        riskScore,
      };
    }).sort((a, b) => b.riskScore - a.riskScore || b.remainingHours - a.remainingHours);

    const teamRows = result.team.map((member) => ({
      id: member._id ? String(member._id) : 'unassigned',
      name: member._id ? memberNames.get(String(member._id)) || 'Workspace member' : 'Unassigned',
      openTasks: member.openTasks,
      remainingHours: Math.round(member.remainingHours * 10) / 10,
      overdueTasks: member.overdueTasks,
    }));
    const activeProjectRows = projectRows.filter((project) => project.openTasks > 0);
    const totalOpenTasks = activeProjectRows.reduce((total, project) => total + project.openTasks, 0);
    const totalRemainingHours = activeProjectRows.reduce((total, project) => total + project.remainingHours, 0);
    const totalBlockedTasks = activeProjectRows.reduce((total, project) => total + project.blockedTasks, 0);

    const riskTaskRows = new Map();
    for (const task of result.riskTasks) {
      riskTaskRows.set(String(task._id), task);
    }
    for (const task of dependencyTasks) {
      const dependencyState = dependencyStateById.get(String(task._id));
      if (dependencyState?.blockedByCount && !riskTaskRows.has(String(task._id))) {
        riskTaskRows.set(String(task._id), {
          _id: task._id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          project: task.project?.name || 'Personal work',
          projectId: task.project?._id || null,
          assignee: task.assignee?.fullname || null,
        });
      }
    }
    const riskTasks = [...riskTaskRows.values()]
      .map((task) => ({
        ...task,
        estimatedHours: task.estimatedHours ?? 2,
        blockedByCount: dependencyStateById.get(String(task._id))?.blockedByCount || 0,
        blockingCount: dependencyStateById.get(String(task._id))?.blockingCount || 0,
        reasons: [
          task.dueDate && new Date(task.dueDate) < today ? 'Overdue' : null,
          task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) < nextWeek ? 'Due within 7 days' : null,
          ['high', 'urgent'].includes(task.priority) ? `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority` : null,
          !task.assignee ? 'Unassigned' : null,
          dependencyStateById.get(String(task._id))?.blockedByCount
            ? `Blocked by ${dependencyStateById.get(String(task._id)).blockedByCount} task${dependencyStateById.get(String(task._id)).blockedByCount === 1 ? '' : 's'}`
            : null,
        ].filter(Boolean),
      }))
      .sort((a, b) => {
        const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };
        return Number(b.blockedByCount > 0) - Number(a.blockedByCount > 0) ||
          dueA - dueB ||
          (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4);
      })
      .slice(0, 12);

    res.json({
      generatedAt: now,
      methodology: {
        defaultEstimateHours: 2,
        forecastWindowDays: 14,
        riskFactors: ['overdue', 'due within seven days', 'high or urgent priority', 'unassigned work', 'blocked by incomplete dependencies'],
      },
      summary: {
        openTasks: totalOpenTasks,
        remainingHours: Math.round(totalRemainingHours * 10) / 10,
        overdueTasks: activeProjectRows.reduce((total, project) => total + project.overdueTasks, 0),
        blockedTasks: totalBlockedTasks,
        atRiskProjects: activeProjectRows.filter((project) => project.riskScore >= 25).length,
      },
      projects: projectRows,
      team: teamRows,
      riskTasks,
    });
  } catch (error) {
    console.error('Failed to calculate delivery control tower:', error);
    res.status(500).json({ message: 'Failed to calculate delivery outlook' });
  }
};

export const bulkUpdateTasks = async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { taskIds, status, priority } = body;
  const allowedFields = new Set(['taskIds', 'status', 'priority']);
  const hasUnexpectedFields = Object.keys(body).some((field) => !allowedFields.has(field));

  if (hasUnexpectedFields) {
    return res.status(400).json({ message: 'Bulk updates only support task status and priority' });
  }
  if (!Array.isArray(taskIds) || taskIds.length === 0 || taskIds.length > 100) {
    return res.status(400).json({ message: 'Select between 1 and 100 tasks' });
  }
  if (
    taskIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id)) ||
    new Set(taskIds.map((id) => id.toLowerCase())).size !== taskIds.length
  ) {
    return res.status(400).json({ message: 'Task IDs must be unique valid IDs' });
  }
  if (status === undefined && priority === undefined) {
    return res.status(400).json({ message: 'Choose a status or priority to update' });
  }
  if (status !== undefined && !taskStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid task status' });
  }
  if (priority !== undefined && !priorities.includes(priority)) {
    return res.status(400).json({ message: 'Invalid task priority' });
  }

  try {
    const taskFilter = await accessibleTasks(req.user.id);
    const updateFilter = { ...taskFilter, _id: { $in: taskIds } };
    const accessibleTaskCount = await Task.countDocuments(updateFilter);
    if (accessibleTaskCount !== taskIds.length) {
      return res.status(404).json({ message: 'One or more tasks were not found or are no longer accessible' });
    }
    if (status === 'done') {
      const selectedTasks = await Task.find(updateFilter).select('_id dependsOn').lean();
      const dependencyIds = [...new Set(selectedTasks.flatMap((task) => (task.dependsOn || []).map(String)))];
      const incompleteIds = new Set(dependencyIds.length
        ? (await Task.find({
          $and: [
            taskFilter,
            { _id: { $in: dependencyIds } },
            { status: { $ne: 'done' } },
          ],
        }).distinct('_id')).map(String)
        : []);
      if (selectedTasks.some((task) => (task.dependsOn || []).some((id) => incompleteIds.has(String(id))))) {
        return res.status(409).json({ message: 'Complete prerequisite tasks before completing selected tasks' });
      }
    }

    const updates = {};
    if (status !== undefined) {
      updates.status = status;
      updates.completedAt = status === 'done' ? new Date() : null;
    }
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.completedAt = status === 'done' ? new Date() : null;

    await Task.updateMany(updateFilter, { $set: updates });
    const tasks = await Task.find(updateFilter)
      .populate('project', 'name color')
      .populate('assignee', 'fullname email')
      .sort({ _id: 1 });

    res.json({ updatedCount: tasks.length, tasks });
  } catch (error) {
    console.error('Failed to bulk update tasks:', error);
    res.status(500).json({ message: 'Failed to update selected tasks' });
  }
};

export const deleteTask = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid task id' });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.project) {
      const project = await getAccessibleProject(task.project, req.user.id);
      if (!project) {
        return res.status(404).json({ message: 'Task not found' });
      }
    } else if (!task.user.equals(req.user.id)) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.updateMany({ dependsOn: task._id }, { $pull: { dependsOn: task._id } });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};
