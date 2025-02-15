const express = require("express");
const router = express.Router();

const Task = require("../models/Task.model");

//Create a new task
router.post("/", (req, res) => {

});

//Get task information
router.get("/:id", (req, res) => {
    const {id} = req.params;
});

//Update task
router.put("/:id", (req, res) => {
    const {id} = req.params;
});

//Delete task
router.delete("/:id", (req, res) => {
    const {id} = req.params;
});


module.exports = router;