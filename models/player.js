const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const commentSchema = require("./comment").commentSchema; // Importing comment schema

const playerSchema = new Schema(
  {
    playerName: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    isCaptain: {
      type: Boolean,
      default: false,
    },
    information: {
      type: String,
      required: true,
    },
    comments: [commentSchema],
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
exports.Player = mongoose.model("player", playerSchema);
