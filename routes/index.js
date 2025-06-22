var express = require("express");
var router = express.Router();
const { Player } = require("../models/player");
const publicController = require("../controllers/publicController");

/* GET home page. */
router.get("/", publicController.getAllPlayers);
router
  .route("/login")
  .get(publicController.getLoginPage)
  .post(publicController.signIn);
router
  .route("/register")
  .get(publicController.getRegisterPage)
  .post(publicController.signUp);

router.get("/players", publicController.getAllPlayers);
router.get("/players/:id", publicController.getPlayerDetail);
router.get("/players/:id/comments", publicController.getPlayerComments);
router.get("/logout", publicController.logout);

module.exports = router;
