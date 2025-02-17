const express = require("express");
const router = express.Router();

const Task = require("../models/User.model");

//Get user information
//Show user info in settings page
router.get("/:id", (req, res) => {
    const {id} = req.params;
});

//Update user
router.put("/:id", (req, res) => {
    const {id} = req.params;
});

//User joins a group
    //Group added to their profile
    //UserID added to the group

//User leaves a group
    //Group removed from their profile
    //UserID removed from the group

    
//Delete user and remove from any groups
router.delete("/:id", (req, res) => {
    const {id} = req.params;
});


module.exports = router;