const express = require("express");
const router = express.Router();

const Group = require("../models/Group.model");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const businessLogic = require("../utils/businessLogic");

//The group model also has the fields weekNumber and weekEndDate
//When the group gets created those get the default value 0 and null respectively
//Both get updated when a week with tasks gets created through the week route

//Create a new group
//Within members, we expect to receive the userID of the user who creates the group
// They'll be the first member of the group
router.post("/", (req, res, next) => {
  const { firstMemberId, firstMemberName } = req.body;
  const name = `${firstMemberName}'s crew`;
  let newGroup = null;
  return Group.create({
    name: name,
    members: [firstMemberId],
  })
    .then((createdGroup) => {
      newGroup = createdGroup;
      return User.findByIdAndUpdate(firstMemberId, {
        group: createdGroup._id.toString(),
      });
    })
    .then(() => {
      res.json(newGroup);
    })
    .catch((error) => {
      console.error("Error while creating the group ->", error);
      next(error);
    });
});

//Get group information
router.get("/:id", (req, res, next) => {
  const { id } = req.params;

  Group.findById(id)
    .populate({ path: "members", select: "name" })
    .then((response) => {
      const isAMember = businessLogic.checkMembership(
        req.payload._id,
        response.members
      );

      if (isAMember) {
        res.json(response);
      } else {
        res
          .status(401)
          .json({
            message: "Sorry, you're not authorized to perform this action.",
          });
      }
    })
    .catch((error) => {
      next(error);
    });
});

//Update group **
router.put("/:id", (req, res, next) => {
  const { id } = req.params;
  const { name, members, recurringTasks, weekNumber, weekEndDate } = req.body;

  Group.findById(id)
    .select("members -_id")
    .then((response) => {
      console.log("select", response)
      const isAMember = businessLogic.checkMembership(
        req.payload._id,
        response.members
      );

      if (isAMember) {
        Group.findByIdAndUpdate(
          id,
          {
            name,
            members,
            recurringTasks,
            weekNumber,
            weekEndDate,
          },
          { new: true }
        ).then((response) => res.json(response))
          .catch((error) => {
            console.error("Error while updating the group ->", error);
            next(error);
          });
      } else {
        res.status(401).json({
          message: "Sorry, you're not authorized to perform this action.",
        });
      }
    });
});

//Join group
router.put("/join/:id", (req, res, next) => {
  const { id } = req.params;
  const { newMember } = req.body;

  Group.findByIdAndUpdate(id, { $push: { members: newMember } }, { new: true })
    .then(() => {
      return User.findByIdAndUpdate(newMember, { group: id });
    })
    .then((updatedUser) => res.status(200).json(updatedUser))
    .catch((error) => {
      console.error("Error while adding user to the group ->", error);
      next(error);
    });
});

//Delete group **
router.delete("/:id", (req, res, next) => {
  const { id } = req.params;

  Group.findById(id)
    .select("members -_id")
    .then((response) => {
      console.log("select", response);
      const isAMember = businessLogic.checkMembership(
        req.payload._id,
        response.members
      );

      if (isAMember) {
        Group.findByIdAndDelete(id)
          .then(() =>
            res.json({ message: `Project with ${id} is removed successfully.` })
          )
          .catch((error) => {
            console.error("Error while deleting the group ->", error);
            next(error);
          });
      } else {
        res.status(401).json({
          message: "Sorry, you're not authorized to perform this action.",
        });
      }
    });
});

module.exports = router;