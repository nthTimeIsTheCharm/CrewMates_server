const express = require("express");
const router = express.Router();

const Task = require("../models/Task.model");

//Business logic functions
const businessLogic = require('../utils/businessLogic');
const dbCalls = require('../utils/callsToDatabase');


//ROUTES

//Gets the tasks for the current week, if there's a current week
//The route expects the currentDate param to be provided as a number
//const originalDate = new Date ('YYYY-MM-DD');
//const dateAsNumbers = originalDate.getTime();
router.get("/:groupId/:currentDate", async (req, res, next) => {
  const { groupId, currentDate } = req.params;

  //Request weekNumber and weekEndDate to the DB
  const weekInfo = await dbCalls.getWeekEndDateAndNumber(groupId);
  const weekEndDate = weekInfo.weekEndDate;

  if (businessLogic.groupHasActiveWeek(currentDate, weekEndDate) === false) {
    res.json("null");
  } else {
    //If there's an active week, then find and send tasks for current weekNumber
    Task.find({
      $and: [{ group: groupId }, { weekNumber: weekInfo.weekNumber }],
    })
      .then((foundTasks) => res.json(foundTasks))
      .catch((error) => {
        /* console.error("Error while fetching this week's tasks ->", error);
        res.status(500).json({ error: "Failed to fetch tasks" }); */
        next(error);
      });
  }
});

//Creates tasks for the week, if there isn't an ongoing week
//The route expects the currentDate param to be provided as a number
//const originalDate = new Date ('YYYY-MM-DD');
//const dateAsNumbers = originalDate.getTime();
router.post("/:groupId/:currentDate", async (req, res, next) => {
  const { groupId, currentDate } = req.params;

  //Request groupInfo to the DB
  const groupInfo = await dbCalls.getGroupInfo(groupId);

  //Double-check there isn't an active week already
  const weekEndDate = groupInfo.weekEndDate;

  if (businessLogic.groupHasActiveWeek(currentDate, weekEndDate) === true) {
    //res.status(500).json({ error: "There is already a week in progress" });
    next("There is already a week in progress");
    return; 
  }

  //Extract necessary values to create the week
  const recurringTasks = groupInfo.recurringTasks;
  const groupMembers = groupInfo.members.map((member) => member.toString());
  const newWeekNumber = groupInfo.weekNumber + 1;

  //Tasks will be assigned based on an array of assignees
  const assignmentOrder = businessLogic.createAssignmentOrder(
    groupMembers,
    recurringTasks.length
  );

  //Create the tasks
  if (recurringTasks.length === 0) {
    console.error("No recurring tasks found");
    res.status(404).json({ error: "No recurring tasks found" });
    return;
  } else {
    
    const newTasks = businessLogic.createTasks(
      recurringTasks,
      assignmentOrder,
      groupId,
      newWeekNumber
    );

    let reponse = {};

    //Save the tasks in the DB
    reponse.tasks = await dbCalls.saveTasksInDB(newTasks, res);

    //Updated the group in the DB with the new week number and end date
    reponse.week = await dbCalls.updateWeekEndDateAndNumber(
      groupId,
      newWeekNumber,
      businessLogic.calculateEndDate(currentDate),
      res
    );

    //Send back a response
    res.status(200).json(reponse);

  }
})
 
module.exports = router;
