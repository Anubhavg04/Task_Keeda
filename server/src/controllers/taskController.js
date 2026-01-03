import Task from '../models/Task.models.js';

// Create karo task ko
export const createTask = async(req,res)=>{
    try {
        const{ title, description, dueDate } = req.body;
        if(!title){
            return res.status(400).json({
                message:"Title is required"
            });
        }

        const task = await Task.create({
            title,
            description,
            dueDate,
            user: req.user.id,
        });
        // console.log(task);

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({
            message:"Server error"
        });
    }
} 

// Get all task user ka
export const getTasks = async(req,res)=>{
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ created: -1,});
        res.json(tasks);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
}

// UPDATE task
export const updateTask = async(req,res)=>{
    try {
        //  console.log("PARAM ID:", req.params.id);
        //  console.log("USER:", req.user);
        //  console.log("BODY:", req.body);
        const taskID = req.params.id;
        const userID = req.user.id;
        const task = await Task.findById(taskID);

        if(!task){
            return res.status(404).json({message:"Task not found"});
        }

        if(task.user.toString() !== userID){
            return res.status(403).json({message: "Not authorized"})
        }
        const updatedTask = await Task.findByIdAndUpdate(
            taskID,
            req.body,
            { new:true }
        );

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message:"Server error"
        })
    }
}

// DELETE task
export const deleteTask = async(req,res)=>{
    try {
        const task = await Task.findOne({
            _id:req.param.id,
            user: req.user.id,
        });

        if(!task){
            return res.status(404).json({
                message:"Task not found"
            })
        }

        await task.deleteOne();
        res.json({message:"Task deleted"});
    } catch (error) {
        res.status(500).json({
            message:"Server error"
        })
    }
}