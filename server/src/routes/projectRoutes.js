import express from 'express';
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProjects,
  removeProjectMember,
} from '../controllers/projectController.js';
import {
  createDiscussionMessage,
  deleteDiscussionMessage,
  getDiscussionSummaries,
  getDiscussionMessages,
  markDiscussionRead,
  updateDiscussionMessage,
} from '../controllers/discussionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getProjects);
router.post('/', createProject);
router.get('/discussion-summaries', getDiscussionSummaries);
router.post('/:id/members', addProjectMember);
router.delete('/:id/members/:memberId', removeProjectMember);
router.get('/:id/discussions', getDiscussionMessages);
router.post('/:id/discussions', createDiscussionMessage);
router.post('/:id/discussions/read', markDiscussionRead);
router.patch('/:id/discussions/:messageId', updateDiscussionMessage);
router.delete('/:id/discussions/:messageId', deleteDiscussionMessage);
router.delete('/:id', deleteProject);

export default router;
