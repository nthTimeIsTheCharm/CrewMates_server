const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const groupSchema = new Schema({
  name: { type: String, required: true },
  members: { 
    type: [Schema.Types.ObjectId],
    ref: "User" },
  recurringTasks: { type:[String], default: ["Takeout the trash", "Wash dishes"]},
  weekNumber: { type: Number, default: 0}
},
{
    timestamps: true,
});

module.exports = model("Group", groupSchema);