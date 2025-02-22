const express = require("express");
const router = express.Router();

const Task = require("../models/Task.model");

//Create a new task
//This would be a one off task created during the current week
router.post("/one-off-task", (req, res) => {
  const { name, assignee, group, weekNumber } = req.body;
//TODO: get the current week from the database
  Task.create({ name, assignee, group, weekNumber })
    .then((newTask) => res.json(newTask))
    .catch((error) => {
      console.error("Error while finding the user ->", error);
      res.status(500).json(error);
    });

});

//Mark task as done/not done
router.put("/:taskId", (req, res) => {
  const { taskId } = req.params;

  Task.findByIdAndUpdate(taskId, { isDone: req.body.isDone }, { new: true })
    .then((updatedTask) => res.json(updatedTask))
    .catch((error) => {
      console.error("Error while finding the user ->", error);
      res.status(500).json(error);
    });

});

//Delete task
//It shouldn't be possible for users to delete tasks once created in a week though?
router.delete("/:taskId", (req, res) => {
  const { taskId } = req.params;

  Task.findByIdAndDelete(taskId)
    .then(() => res.json({ message: "Task successfully deleted." }))
    .catch((error) => {
      console.error(`Error while deleting task ${id} the user ->`, error);
      res.status(500).json(error);
    });

});

module.exports = router;
