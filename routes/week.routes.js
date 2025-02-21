const express = require("express");
const router = express.Router();

const Task = require("../models/Task.model");
const Group = require("../models/Group.model");

////////////////////////////////////////
////// Functions for checks
///////////////////////////////////////

async function getGroupInfo(groupId, req) {
  try {
    const response = await fetch(
      `${req.protocol}://${req.get("host")}/api/groups/${groupId}`
    );
    const data = await response.json();
    return {
      members: data.members,
      recurringTasks: data.recurringTasks,
      weekNumber: data.weekNumber,
      weekEndDate: data.weekEndDate,
    };
  } catch (error) {
    console.error("Error while fetching weekEndDate and weekNumber ->", error);
    return { error: "Failed to fetch task group information." };
  }
}

async function getWeekEndDateAndNumber(groupId, req) {
  try {
    const response = await fetch(
      `${req.protocol}://${req.get("host")}/api/groups/${groupId}`
    );
    const data = await response.json();
    return {
      weekNumber: data.weekNumber,
      weekEndDate: data.weekEndDate,
    };
  } catch (error) {
    console.error("Error while fetching weekEndDate and weekNumber ->", error);
    return { error: "Failed to fetch task group information." };
  }
}

async function updateWeekEndDateAndNumber(
  groupId,
  newWeekNumber,
  endDate,
  req
) {
  try {
    fetch(`${req.protocol}://${req.get("host")}/api/groups/${groupId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weekNumber: newWeekNumber, weekEndDate: endDate })
      }
    )
  } catch (error) {
    console.error(
      `Error while updating weekNumber and weekEndDate for group ${groupId} ->`, error
    );
  }
}

////////////////////////////////////////
////// Business logic
///////////////////////////////////////

//Tasks are distributed so that at most there's 1 task difference between assignees
function createAssignmentOrder(members, taskCount) {
  const result = [];
  const assignees = [];

  for (let i = 1; i <= taskCount; i++) {
    if (assignees.length === 0) {
      //When we end up here it means that there's still tasks to assign
      // we'res starting over after each round of assignments
      assignees.push(...members);
    }
    const randomIndex = Math.ceil(Math.random() * (assignees.length - 1));
    result.push(assignees[randomIndex]);
    assignees.splice(randomIndex, 1);
  }
  return result;
}

//Each task gets created and assigned based on the assignment order
function createTasks(recurringTasks, assignments, groupId, newWeekNumber) {
  const tasks = recurringTasks.map((taskName, index) => {
    return {
      name: taskName,
      assignee: assignments[index],
      group: groupId,
      weekNumber: newWeekNumber,
    };
  });
  return tasks;
}

//Weeks can only span from Monday to Sunday (at least for now)
//The deadline to complete weekly tasks is Sunday at midnight
//As a result, weeks need to end on Mondays
//Future improvement: When a user tries to create a week on a Saturday or Sunday, ask them whether they want the week to finish this Sunday or the next
function calculateEndDate(currentDate) {
    console.log(currentDate);
  //current data is in milliseconds
  const initialDate = new Date(currentDate); //we convert into to a date object
  console.log(initialDate);
  const dayOfWeek = initialDate.getDay();
  console.log(dayOfWeek);
  let endDate = new Date(); //doesn't matter what date, we'll reassign
  console.log("endDate declared", endDate);
  if (dayOfWeek === 0) {
    //If the user creates a week on a Sunday
    //For now they just have this one day to complete the tasks
    endDate.setDate(initialDate.getDate() + 1);
    console.log("endDate inside if", endDate);
  } else {
    for (let i = dayOfWeek; i <= 8; i++) {
      endDate.setDate(initialDate.getDate() + 1);
      console.log("endDate in loop",i,"----",endDate);
    }
  }
  return endDate;
}

////////////////////////////////////////
////// ROUTES
///////////////////////////////////////

//Gets the tasks for the current week, if there's a current week
//The route expects the currentDate param to be provided as a number
//const originalDate = new Date ('YYYY-MM-DD');
//const dateAsNumbers = originalDate.getTime();
router.get("/:groupId/:currentDate", async (req, res) => {
  const { groupId, currentDate } = req.params;

  //Request weekNumber and weekEndDate to the group endpoint
  const weekInfo = await getWeekEndDateAndNumber(groupId, req);
  //Sending the req object along to dynamically create the URL to the endpoint and avoid hardcoding the URL as the relative path doesn't do the trick.

  const weekNumber = weekInfo.weekNumber;
  const weekEndDate = new Date(weekInfo.weekEndDate.slice(0, 10)); //Create date without time
  const weekEndDateMs = weekEndDate.getTime(); //turned into milliseconds for the comparison
  console.log(weekEndDateMs);

  //Check if the group has an active week
  if (weekEndDate === null || currentDate > weekEndDateMs) {
    //weekDate being null means the group has never created a week
    //currentDate > weekEndDate means that the last week they had has already ended
    res.json("null");
  } else {
    //If weekEndDate has NOT passed then find and send tasks for current weekNumber
    Task.find({ $and: [{ group: groupId }, { weekNumber: weekNumber }] })
      .then((foundTasks) => res.json(foundTasks))
      .catch((error) => {
        console.error("Error while fetching this week's tasks ->", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
      });
  }
});

//Creates tasks for the week, if there isn't an ongoing week
//The route expects the currentDate param to be provided as a number
//const originalDate = new Date ('YYYY-MM-DD');
//const dateAsNumbers = originalDate.getTime();
router.post("/:groupId/:currentDate", async (req, res) => {
  const { groupId, currentDate } = req.params;

  //Get information about the group from DB
  let groupInfo = await getGroupInfo(groupId, req);
  const recurringTasks = groupInfo.recurringTasks;
  const groupMembers = groupInfo.members.map((member) => member.toString());
  const newWeekNumber = groupInfo.weekNumber + 1;

  //Tasks will be assigned based on an array of assignees
  const assignments = createAssignmentOrder(
    groupMembers,
    recurringTasks.length
  );

  //Create the tasks
  if (recurringTasks.length === 0) {
    console.error("No recurring tasks found");
    res.status(404).json({ error: "No recurring tasks found" });
  } else {
    const newTasks = createTasks(
      recurringTasks,
      assignments,
      groupId,
      newWeekNumber
    );

    //Save the tasks in the DB
    Task.insertMany(newTasks)
      .then((createdTasks) => {
        //repond to the front-end withe the created tasks
        res.json(createdTasks);
      })
      .then(() => {
        //Updated the group in the DB with the new week number and end date
        updateWeekEndDateAndNumber(
          groupId,
          newWeekNumber,
          calculateEndDate(currentDate),
          req
        );
      })
      .catch((error) => {
        console.error("Error while creating the tasks for the week ->", error);
        res.status(500).json({ error: "Failed to create the tasks" });
      });
  }

  //Update prevWeekNumber in group (current+1)
  //Update week end date in group
  //The value saved in the context would need to be updated too
});

module.exports = router;
