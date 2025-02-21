const express = require("express");
const router = express.Router();

const Task = require("../models/Task.model");

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
    console.error("Error while fetching groupInfo ->", error);
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
    fetch(`${req.protocol}://${req.get("host")}/api/groups/${groupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weekNumber: newWeekNumber, weekEndDate: endDate }),
    });
  } catch (error) {
    console.error(
      `Error while updating weekNumber and weekEndDate for group ${groupId} ->`,
      error
    );
  }
}

////////////////////////////////////////
////// Business logic
///////////////////////////////////////

//If there's already a week that hasn't reached its end date, we don't want to create a new week
function checkForActiveWeek(currentDate, weekEndDate) {
  let result; 

  //Create date without the time
  const weekEndDateYYYYMMDD = new Date(weekEndDate.toString().slice(0, 10));

  //Turn date into milliseconds for the comparison
  const weekEndDateMs = weekEndDateYYYYMMDD.getTime();

  //weekDate being null means the group has never created a week
  //currentDate > weekEndDate means that the last week they had has already ended
  if (
    weekEndDate === "1970-01-01T00:00:00.000Z" ||
    currentDate > weekEndDateMs
  ) {
    result = false;
  } else {
    result = true;
  }

  return result;
}

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

//As they're created, the tasks get assigned based on the assignment order
function createTasks(recurringTasks, assignmentOrder, groupId, newWeekNumber) {
  const tasks = recurringTasks.map((taskName, index) => {
    return {
      name: taskName,
      assignee: assignmentOrder[index],
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
  //current data is in milliseconds
  const initialDate = new Date(Number(currentDate)); //we convert into to a date object
  const dayOfWeek = initialDate.getDay();
  let endDate = new Date(); //doesn't matter what date, we'll reassign

  if (dayOfWeek === 0) {
    //If the user creates a week on a Sunday
    //For now they just have this one day to complete the tasks
    endDate.setDate(initialDate.getDate() + 1);
    console.log("endDate inside if", endDate);
  } else {
    const daysTillMonday = 8 - dayOfWeek;
    endDate.setDate(initialDate.getDate() + daysTillMonday);
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
  //Sending the req object along to dynamically create the URL to the endpoint and avoid hardcoding the URL
  //Using a relative path doesn't do the trick.
  const weekInfo = await getWeekEndDateAndNumber(groupId, req);

  if ((checkForActiveWeek(currentDate, weekInfo.weekEndDate)) === false){
    res.json("null");
  } else {
    //If there's an active week, then find and send tasks for current weekNumber
    Task.find({
      $and: [{ group: groupId }, { weekNumber: weekInfo.weekNumber }],
    })
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

  //Double-check there isn't an active week already
  if (checkForActiveWeek(currentDate, groupInfo.weekEndDate) === true) {
    res.status(500).json({ error: "There is already a week in progress" }); //This error makes the server crash
  }

  //Extract necessary values to create the week
  const recurringTasks = groupInfo.recurringTasks;
  const groupMembers = groupInfo.members.map((member) => member.toString());
  const newWeekNumber = groupInfo.weekNumber + 1;

  //Tasks will be assigned based on an array of assignees
  const assignmentOrder = createAssignmentOrder(
    groupMembers,
    recurringTasks.length
  );

  //Create the tasks
  if (recurringTasks.length === 0) {
    console.error("No recurring tasks found");
    res.status(404).json({ error: "No recurring tasks found" }); //This error works fine
  } else {
    const newTasks = createTasks(
      recurringTasks,
      assignmentOrder,
      groupId,
      newWeekNumber
    );

    //Save the tasks in the DB
    Task.insertMany(newTasks)
      .then((createdTasks) => {
        //repond to the front-end withe the created tasks
        res.status(201).json(createdTasks);
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
});

module.exports = router;
