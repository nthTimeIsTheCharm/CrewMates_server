const Task = require("../models/Task.model");
const Group = require("../models/Group.model");

function getGroupInfo(groupId, next) {
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
      next(error);
    });
}

function saveTasksInDB(newTasks, next) {

  return Task.insertMany(newTasks)
    .then((createdTasks) => {
      return createdTasks;
    })
    .catch((error) => {
      console.error("Error while saving the tasks for the week ->", error);
      next(error);
    });

}

function updateWeekEndDateAndNumber(groupId, newWeekNumber, endDate, next) {
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
      next(error);
    });
}

module.exports = {
  getGroupInfo,
  saveTasksInDB,
  updateWeekEndDateAndNumber,
};
