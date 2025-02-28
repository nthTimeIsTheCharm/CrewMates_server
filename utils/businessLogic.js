// Check if user is a member of the group they're trying to interact with
function checkMembership (idInToken, groupMembersIDs){
  const groupMembers = groupMembersIDs.map((memberID) => memberID.toString());
  if (groupMembers.includes(idInToken)){
    return true;
  } else {
    return false;
  }
}


//If there's already a week that hasn't reached its end date, we don't want to create a new week
function groupHasActiveWeek(currentDate, weekEndDate) {
  let result;

  //Create date without the time
  const weekEndDateYYYYMMDD = new Date(weekEndDate.toISOString().slice(0, 10));

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
  } else {
    const daysTillMonday = 8 - dayOfWeek; //8 because Sunday is still within deadline
    endDate.setDate(initialDate.getDate() + daysTillMonday);
  }
  return endDate;
}

function createWeek (groupId, recurringTasks, members, newWeekNumber){
  
  //Turn the array of ObjectIds into an array of strings
  const groupMembers = members.map((memberID) => memberID.toString());

  //Tasks will be assigned based on an array of assignees
  const assignmentOrder = createAssignmentOrder( groupMembers, recurringTasks.length);

  //Create the tasks
  const newTasks = createTasks(
    recurringTasks,
    assignmentOrder,
    groupId,
    newWeekNumber
    );

  return newTasks;
}

module.exports = {
  checkMembership,
  groupHasActiveWeek,
  createAssignmentOrder,
  createTasks,
  calculateEndDate,
  createWeek
};