const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    memberName: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId; // Password không bắt buộc nếu login bằng Google
      },
    },
    name: {
      type: String,
      required: true,
    },
    YOB: {
      type: Number,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // THÊM: Google OAuth fields
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values
    },
    email: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
);

// Index for Google ID
memberSchema.index({ googleId: 1 }, { sparse: true });

exports.Member = mongoose.model("Member", memberSchema);