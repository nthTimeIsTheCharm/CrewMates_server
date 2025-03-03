const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const taskSchema = new Schema(
  {
    name: { type: String, required: true },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigneeName: {
      type: String,
      required: true,
    },
    isDone: { type: Boolean, default: false },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    weekNumber: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Task", taskSchema);
