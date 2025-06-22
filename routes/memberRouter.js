const express = require("express");
const memberRouter = express.Router();
const memberController = require("../controllers/memberController");
const { authMiddleware, authMiddlewareInView } = require("../middlewares/auth");

memberRouter.post(
  "/comments/:playerId",
  authMiddlewareInView,
  memberController.postComment
);
memberRouter.get("/", authMiddlewareInView, memberController.getUserProfile);
memberRouter.post(
  "/update-profile",
  authMiddlewareInView,
  memberController.updateUserProfile
);
memberRouter.post(
  "/change-password",
  authMiddlewareInView,
  memberController.changePassword
);
// THÊM: Edit comment route
memberRouter.post(
  "/comments/:playerId/:commentId/edit",
  authMiddlewareInView,
  memberController.editComment
);
module.exports = memberRouter;
