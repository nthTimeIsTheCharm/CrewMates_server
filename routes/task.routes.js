const express = require("express");
const router = express.Router();

const Task = require("../models/Task.model");
const Group = require("../models/Group.model");


async function getRecurringTasks(groupId){
    return Group.findById(groupId)
      .select('recurringTasks -_id')
      .then(response => response.recurringTasks) //implicit return
      .catch((error) => {
        console.error("Error while fetching recurring tasks ->", error);
        res.status(500).json({ error: "Failed to create the week" });
      });
}

/* //Create a new task
router.post("/single", (req, res) => {
    const {name, groupId, weekNumber} = req.body;
    Task.create({name, group: groupId, weekNumber})
    .then()
    .catch()
}); */

//Create tasks for the week
router.post("/week", async (req, res) => {
  const { groupId, prevWeekNumber } = req.body;

  //Fetch recurring tasks
  let recurringTasks = [];
  try {
    recurringTasks = await getRecurringTasks(groupId);
  } catch {
    console.error("Error while fetching recurring tasks ->", error);
    res.status(500).json({ error: "Failed to create the week" });
  }

  //Create the tasks
  if (recurringTasks.length === 0) {
    console.error("No recurring tasks found");
    res.status(404).json({ error: "No recurrent tasks found" });
    //TODO - Should the frontend check if the group has any recurring tasks to decide whether to even provided the option to create a week?
  } else {
    const newTasks = recurringTasks.map((taskName) => {
      return {
        name: taskName,
        assignee: "67b08d45c85d4d61a35489bf",
        //TODO create function to randomly assign
        //Decide how to get group members. Saved in context?
        group: groupId,
        prevWeekNumber: prevWeekNumber + 1,
      };
    });

    //TODO Assign the tasks

    //Save the tasks in the DB
    Task.insertMany(newTasks)
      .then((createdTasks) => res.json(createdTasks))
      .catch((error) => {
        console.error("Error while creating the tasks for the week ->", error);
        res.status(500).json({ error: "Failed to create the tasks" });
      });
  }
  //Update prevWeekNumber in group (current+1) and in context?
});

//Get task information
router.get("/:id", (req, res) => {
    const {id} = req.params;
});

//Update task
router.put("/:id", (req, res) => {
    const {id} = req.params;
});

//Delete task
router.delete("/:id", (req, res) => {
    const {id} = req.params;
});


module.exports = router;