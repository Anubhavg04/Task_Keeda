import express from "express";
import{
    createTask,
    getTasks,
    getTaskSummary,
    getDeliveryControlTower,
    updateTask,
    bulkUpdateTasks,
    deleteTask,
} from "../controllers/taskController.js"
import { protect } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

router.use(protect);

router.post("/", createTask);
router.get("/summary", getTaskSummary);
router.get("/delivery-control-tower", getDeliveryControlTower);
router.get("/",getTasks);
router.patch("/bulk", bulkUpdateTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;