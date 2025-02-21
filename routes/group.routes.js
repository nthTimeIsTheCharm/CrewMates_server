const express = require("express");
const router = express.Router();

const Group = require("../models/Group.model");
//The group model also has the fields weekNumber and weekEndDate
//When the group gets created those get the default value 0 and null respectively
//Both get updated when a week with tasks gets created through the week route

//Create a new group
//Within members, we expect to receive the userID of the user who creates the group
// They'll be the first member of the group
router.post("/", (req, res) => {
  const { name, firstMemberId } = req.body;
  Group.create({
    name: name,
    members: [firstMemberId],
  })
    .then((response) => res.json(response))
    .catch((error) => {
      console.error("Error while creating the group ->", error);
      res.status(500).json({ error: "Failed to create the group" });
    });
});

//Get group information
router.get("/:id", (req, res) => {
  const { id } = req.params;
  Group.findById(id)
    .then((response) => res.json(response))
    .catch((error) => {
      console.error("Error while finding the group ->", error);
      res.status(500).json({ error: "Failed to find the group" });
    });
});

//Update group
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, members, recurringTasks, weekNumber, weekEndDate } = req.body;
  console.log(req.params);
  Group.findByIdAndUpdate(
    id,
    {
      name,
      members,
      recurringTasks,
      weekNumber,
      weekEndDate
    },
    { new: true }
  )

    .then((response) => res.json(response))
    .catch((error) => {
      console.error("Error while updating the group ->", error);
      res.status(500).json({ error: "Failed to update the group" });
    });
});

//Delete group
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  Group.findByIdAndDelete(id)
    .then(() =>
      res.json({ message: `Project with ${id} is removed successfully.` })
    )
    .catch((error) => {
      console.error("Error while deleting the group ->", error);
      res.status(500).json({ error: "Failed to delete the group" });
    });
});

module.exports = router;
