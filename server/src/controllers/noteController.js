import mongoose from 'mongoose';
import Note from '../models/Note.models.js';
import Project from '../models/Project.models.js';
import { getAccessibleProject } from './projectController.js';

export const getNotes = async (req, res) => {
  try {
    let filter;
    if (req.query.projectId) {
      const project = await getAccessibleProject(req.query.projectId, req.user.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found or you do not have access' });
      }
      filter = { project: project._id };
    } else {
      const projectIds = await Project.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] })
        .distinct('_id');
      filter = {
        $or: [
          { owner: req.user.id, project: null },
          { project: { $in: projectIds } },
        ],
      };
    }

    const notes = await Note.find(filter)
      .populate('project', 'name color')
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

export const createNote = async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body.content === 'string' ? req.body.content : '';
  if (!title || title.length > 120 || content.length > 20000) {
    return res.status(400).json({ message: 'A title of up to 120 characters and content of up to 20,000 characters are required' });
  }

  try {
    let project = null;
    if (req.body.projectId) {
      project = await getAccessibleProject(req.body.projectId, req.user.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found or you do not have access' });
      }
    }

    const note = await Note.create({
      title,
      content,
      owner: req.user.id,
      project: project?._id || null,
    });
    await note.populate('project', 'name color');
    res.status(201).json(note);
  } catch (error) {
    console.error('Failed to create note:', error);
    res.status(500).json({ message: 'Failed to create note' });
  }
};

export const updateNote = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid note id' });
  }
  if (req.body.title !== undefined && (typeof req.body.title !== 'string' || !req.body.title.trim() || req.body.title.trim().length > 120)) {
    return res.status(400).json({ message: 'Note title is required and must be 120 characters or fewer' });
  }
  if (req.body.content !== undefined && (typeof req.body.content !== 'string' || req.body.content.length > 20000)) {
    return res.status(400).json({ message: 'Note content must be 20,000 characters or fewer' });
  }

  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.project) {
      const project = await getAccessibleProject(note.project, req.user.id);
      if (!project) return res.status(404).json({ message: 'Note not found' });
    } else if (!note.owner.equals(req.user.id)) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (req.body.title !== undefined) note.title = req.body.title.trim();
    if (req.body.content !== undefined) note.content = req.body.content;
    await note.save();
    await note.populate('project', 'name color');
    res.json(note);
  } catch (error) {
    console.error('Failed to update note:', error);
    res.status(500).json({ message: 'Failed to update note' });
  }
};

export const deleteNote = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid note id' });
  }

  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.project) {
      const project = await getAccessibleProject(note.project, req.user.id);
      if (!project) return res.status(404).json({ message: 'Note not found' });
    } else if (!note.owner.equals(req.user.id)) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Failed to delete note:', error);
    res.status(500).json({ message: 'Failed to delete note' });
  }
};
