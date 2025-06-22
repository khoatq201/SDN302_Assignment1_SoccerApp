const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
exports.Comment = mongoose.model("comment", commentSchema);
exports.commentSchema = commentSchema; // Export schema để có thể sử dụng trong models khác
