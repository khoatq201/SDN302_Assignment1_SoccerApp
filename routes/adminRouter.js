const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {adminMiddlewareInView } = require("../middlewares/auth");

// Team routes
router
  .route("/teams")
  .get(adminMiddlewareInView,adminController.getCreateTeam)
  .post(adminMiddlewareInView,adminController.createTeam);
// THÊM: Team edit/delete routes
router.post("/teams/:teamId/edit", adminMiddlewareInView, adminController.editTeam);
router.post("/teams/:teamId/delete", adminMiddlewareInView, adminController.deleteTeam);
// Player routes
router
  .route("/players")
  .get(adminMiddlewareInView,adminController.getCreatePlayer)
  .post(adminMiddlewareInView,adminController.createPlayer);
router.get("/players/:playerId/edit", adminMiddlewareInView, adminController.getEditPlayer);
router.post("/players/:playerId/edit", adminMiddlewareInView, adminController.editPlayer);
router.post("/players/:playerId/delete", adminMiddlewareInView, adminController.deletePlayer);
// Dashboard route - THÊM
router.get("/", adminMiddlewareInView, adminController.getDashboard);
module.exports = router;
