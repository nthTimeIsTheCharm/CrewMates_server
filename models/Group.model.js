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
    weekNumber: { type: Number, default: 0 },
    weekEndDate: { type: Date, default: "1970-01-01T00:00:00.000Z" },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Group", groupSchema);