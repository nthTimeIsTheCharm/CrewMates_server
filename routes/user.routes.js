const express = require("express");
const router = express.Router();

const User = require("../models/User.model");

//Get user information

router.get("/:id", (req, res, next) => {
  const { id } = req.params;
  User.findById(id)
    .then((response) =>
      res.json({
        _id: response._id,
        name: response.name,
        email: response.email,
        group: response.group,
      })
    )
    .catch((error) => {
      console.error("Error while finding the user ->", error);
      /* res.status(500).json({ error: "Failed to find the " }); */
      next(error);
    });
});

//Update user

router.put("/:id", (req, res, next) => {
  const { id } = req.params;
  console.log(req.body);
  const { name, email, group } = req.body;
  if (id !== req.payload._id || req.body.removedFromGroup === true) {
    return res.status(401).json({
      message: "Sorry, you're not authorized to perform this action",
    });
  }
  User.findByIdAndUpdate(
    id,
    {
      name,
      email,
      group,
    },
    { new: true }
  )

    .then((response) =>
      res.json({
        name: response.name,
        email: response.email,
        group: response.group,
      })
    )
    .catch((error) => {
      console.error("Error while updating the user ->", error);
      /* res.status(500).json({ error: "Failed to update the user" }); */
      next(error);
    });
});

//Delete user
//TODO: When a user gets deleted, we need to do something with the tasks in their name
router.delete("/:id", (req, res, next) => {
  const { id } = req.params;
  if (id !== req.payload._id) {
    return res.status(401).json({
      message: "Sorry, you're not authorized to perform this action",
    });
  }
  User.findByIdAndDelete(id)
    .then(() =>
      res.json({ message: `User with ${id} is removed successfully.` })
    )
    .catch((error) => {
      console.error("Error while deleting the user ->", error);
      /* res.status(500).json({ error: "Failed to delete the user" }); */
      next(error);
    });
});

module.exports = router;
