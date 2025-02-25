const Task = require("../models/Task.model");
const Group = require("../models/Group.model");

async function getGroupInfo(groupId) {
  return Group.findById(groupId)
    .select("members recurringTasks weekNumber weekEndDate -_id")
    .then((response) => {
      return {
        members: response.members,
        recurringTasks: response.recurringTasks,
        weekNumber: response.weekNumber,
        weekEndDate: response.weekEndDate,
      };
    })
    .catch((error) => {
      console.error(`Error while fetching group info for ${groupId}->`, error);
      /* res.status(500).json({ error: "Failed to find the group" }); */
      next(error);
    });
}

async function getWeekEndDateAndNumber(groupId) {
  return Group.findById(groupId)
    .select("weekNumber weekEndDate -_id")
    .then((response) => {
      return {
        weekNumber: response.weekNumber,
        weekEndDate: response.weekEndDate,
      };
    })
    .catch((error) => {
      console.error(`Error while fetching group info for ${groupId}->`, error);
      /* res.status(500).json({ error: "Failed to find the group" }); */
      next(error);
    });
}

async function saveTasksInDB(newTasks, res) {

  return Task.insertMany(newTasks)
    .then((createdTasks) => {
      return createdTasks;
    })
    .catch((error) => {
      console.error("Error while saving the tasks for the week ->", error);
      next(error);
    });

}

async function updateWeekEndDateAndNumber(groupId, newWeekNumber, endDate, res) {
  return Group.findByIdAndUpdate(
    groupId,
    {
      weekNumber: newWeekNumber,
      weekEndDate: endDate,
    },
    { new: true }
  ).then((updatedGroup) => {
      return {
        weekEndDate: updatedGroup.weekEndDate,
        weekNumber: updatedGroup.weekNumber,
      };
    })
    .catch((error) => {
      console.error("Error while updating the group after creating the tasks for the week ->", error);
      //res.status(500).json("Failed to create the tasks");
      next(error);
    });
}

module.exports = {
  getGroupInfo,
  getWeekEndDateAndNumber,
  saveTasksInDB,
  updateWeekEndDateAndNumber,
};
