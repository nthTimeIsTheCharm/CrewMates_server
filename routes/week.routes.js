const express = require("express");
const router = express.Router();

//Business logic functions
const businessLogic = require("../utils/businessLogic");
const dbCalls = require("../utils/callsToDatabase");
//ROUTES

//Gets the tasks for the current week, if there's a current week
//The route expects the currentDate param to be provided as a number
//const originalDate = new Date ('YYYY-MM-DD');
//const dateAsNumbers = originalDate.getTime();

router.get("/:groupId/:currentDate", (req, res, next) => {
  const { groupId, currentDate } = req.params;

  //Request weekNumber and weekEndDate to the DB
  dbCalls
    .getGroupInfo(groupId, next)
    .then((response) => {
      //Check the requester is a group member
      const isMember = businessLogic.checkMembership(
        req.payload._id,
        response.members
      );
      if (!isMember) {
        res
          .status(401)
          .json({
            message: "Sorry, you're not authorized to perform this action.",
          });
        return;
      }

      //If there's an active week, returns the tasks for the week. If there is no active week, returns the info to know if the week can be created"
      const weekNumber = response.weekNumber;
      console.log(weekNumber);
      const weekEndDate = response.weekEndDate;
      const hasActiveWeek = businessLogic.groupHasActiveWeek(
        currentDate,
        weekEndDate
      );
      if (!hasActiveWeek && !response.recurringTasks.length) {
        res.json({ hasActiveWeek: false, hasRecurringTasks: false });
      } else if (!hasActiveWeek && response.recurringTasks.length) {
        res.json({ hasActiveWeek: false, hasRecurringTasks: true });
      } else {
        dbCalls
          .getThisWeeksTasks(groupId, weekNumber, next)
          .then((thisWeeksTasks) => {
            res.json(thisWeeksTasks);
          })
          .catch((error) => {
            next(error);
          });
      }
    })
    .catch((error) => {
      next(error);
    });
});

//Creates tasks for the week, if there isn't an ongoing week
//The route expects the currentDate param to be provided as a number
//const originalDate = new Date ('YYYY-MM-DD');
//const dateAsNumbers = originalDate.getTime();

router.post("/:groupId/:currentDate", (req, res, next) => {
  const { groupId, currentDate } = req.params;

  //Request groupInfo to the DB
  dbCalls
    .getGroupInfo(groupId, next)
    .then((groupInfo) => {
      //Check the requester is a group member
      const isMember = businessLogic.checkMembership(
        req.payload._id,
        groupInfo.members
      );

      if (!isMember) {
        res.status(401).json({
          message: "Sorry, you're not authorized to perform this action.",
        });
        return;
      }

      //Check there isn't an active week already
      if (
        businessLogic.groupHasActiveWeek(currentDate, groupInfo.weekEndDate) ===
        true
      ) {
        res.status(400).json("There is already a week in progress");
        return;
        //Check the group has tasks from which to create the new
      } else if (groupInfo.recurringTasks.length === 0) {
        res.status(404).json({ error: "No recurring tasks found" });
        return;
      } else {
        //Create the tasks
        const { recurringTasks, members, weekNumber } = groupInfo;
        const newTasks = businessLogic.createWeek(
          groupId,
          recurringTasks,
          members,
          weekNumber + 1
        );

        //Gathering the data to send back in the response
        let response = {};
        console.log(response);

        //Save the tasks in the DB
        dbCalls
          .saveTasksInDB(newTasks, next)
          .then((savedTasks) => {
            response.tasks = savedTasks;
            //Updated the group in the DB with the new week number and end date
          })
          .then(() => {
            dbCalls.updateWeekEndDateAndNumber(
              groupId,
              weekNumber + 1,
              businessLogic.calculateEndDate(currentDate)
            );
          })
          .then((updatedWeekInfo) => {
            response.newWeek = updatedWeekInfo;
            //Send back a response
            res.status(200).json(response);
          })
          .catch((error) => {
            next(error);
          });
      }
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = router;
