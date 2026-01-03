import Task from '../models/Task.models.js';

// Create karo task ko
export const createTask = async(req,res)=>{
    try {
        const{ title, description, status,  dueDate } = req.body;

        if(!title){
            return res.status(400).json({
                message:"Title is required"
            });
        }

        const task = await Task.create({
            title,
            description,
            status: status || "todo",
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

// Get all task user ka.
// Implementing query based filtering and regex search to keep the API flexible and scalable.
export const getTasks = async(req,res)=>{
    try {

        const{ status, search, sort , order = 'desc' ,  page=1, limit=10 } = req.query;

        let pageNumber = Number(page) || 1;
        let limitNumber = Number(limit) || 10;
        if(limitNumber > 100) limitNumber = 100;
        if(pageNumber < 1) pageNumber = 1;

        const query = {
            user: req.user.id,
            isDeleted: false,
        };

        // filtering through status
        if(status){
            query.status = status;
        }

        // searching through title
        if(search){
            query.$or = [
                {title : {$regex : search, $options: "i"}},
                {description : {$regex : search, $options: "i"}}
            ];
        }

        let sortOption = { createdAt: -1 };
        if(sort){
            const sortDirection = order === 'asc' ? 1 : -1;
            sortOption = {[sort] : sortDirection};
        }

        const skip = (pageNumber - 1) * limitNumber;

        const tasks = await Task.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber);

        const totalTasks = await Task.countDocuments(query);
        res.json({
            tasks,
            pagination: {
                totalTasks,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalTasks/limitNumber),
                limit: limitNumber,
            },
        });

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

        const task = await Task.findById({
            _id: taskID,
            user: userID,
            isDeleted: false,
        });

        if(!task){
            return res.status(404).json({message:"Task not found"});
        }

        const { title, description, status, dueDate } = req.body;

        // status validation
        if(status && !["todo", "in-progress", "done"].includes(status)){
            return res.status(400).json({message: "Invalid status value"})
        }

        if(title !== undefined) task.title = title;
        if(description !== undefined) task.description = description;
        if(status !== undefined) task.status = status;
        if(dueDate !== undefined) task.dueDate = dueDate;

        await task.save();

        res.status(200).json(task);
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