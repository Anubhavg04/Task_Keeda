import express from 'express';
import {
  addProjectMember,
  createProject,
  deleteProject,
  getProjects,
  removeProjectMember,
} from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getProjects);
router.post('/', createProject);
router.post('/:id/members', addProjectMember);
router.delete('/:id/members/:memberId', removeProjectMember);
router.delete('/:id', deleteProject);

export default router;
