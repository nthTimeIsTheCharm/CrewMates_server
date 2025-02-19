const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    recurringTasks: { type: [String] },
    weekNumber: { 
      type: Number, 
      default: 0 },
    weekEndDate: { 
      type: Date, 
      default: null 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Group", groupSchema);
