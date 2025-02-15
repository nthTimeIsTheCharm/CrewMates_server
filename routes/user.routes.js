const express = require("express");
const router = express.Router();

const Task = require("../models/User.model");

//Create a new user
router.post("/", (req, res) => {

});

//Get user information
router.get("/:id", (req, res) => {
    const {id} = req.params;
});

//Update user
router.put("/:id", (req, res) => {
    const {id} = req.params;
});

//Delete user
router.delete("/:id", (req, res) => {
    const {id} = req.params;
});


module.exports = router;