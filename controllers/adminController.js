console.log("adminController loading...");

const Team = require("../models/team").Team;
const Player = require("../models/player").Player;
const { Member } = require("../models/member");

console.log("Models loaded successfully");
exports.getDashboard = async (req, res) => {
  try {
    console.log("getDashboard called");
    
    // Get statistics
    const totalTeams = await Team.countDocuments();
    const totalPlayers = await Player.countDocuments();
    const totalMembers = await Member.countDocuments();
      // THÊM: Map query parameters to template variables
    const success = req.query.success;
    const error = req.query.error;
    // Get teams with player count
    const teamsWithCount = await Team.aggregate([
      {
        $lookup: {
          from: "players",
          localField: "_id",
          foreignField: "team",
          as: "players"
        }
      },
      {
        $addFields: {
          playerCount: { $size: "$players" }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Get players with team info
    const players = await Player.find()
      .populate("team", "teamName")
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get members with comment count
    const membersWithComments = await Member.aggregate([
      {
        $lookup: {
          from: "players",
          localField: "_id",
          foreignField: "comments.author",
          as: "comments"
        }
      },
      {
        $addFields: {
          commentCount: {
            $sum: {
              $map: {
                input: "$comments",
                as: "player",
                in: {
                  $size: {
                    $filter: {
                      input: "$$player.comments",
                      as: "comment",
                      cond: { $eq: ["$$comment.author", "$_id"] }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    console.log("Dashboard data loaded successfully");
    
    res.render("admin/index", {
      title: "Admin Dashboard",
       success: success,   // THÊM: Map từ query param
      error: error, 
      stats: {
        totalTeams,
        totalPlayers,
        totalMembers
      },
      user: req.session.user,
      teams: teamsWithCount,
      players: players,
      members: membersWithComments,
      currentPage: "dashboard",
      breadcrumbs: ["Dashboard"],
      layout: "admin",
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.render("admin/index", {
      title: "Admin Dashboard",
       success: success,   // THÊM: Map từ query param
      error: error, 
      stats: {  
        totalTeams: 0,
        totalPlayers: 0,
        totalMembers: 0
      },
      teams: [],
      players: [],
      members: [],
      currentPage: "dashboard",
      error: "Unable to load dashboard data",
      breadcrumbs: ["Dashboard"],
      layout: "admin",
    });
  }
};

// Get create team page with existing teams
exports.getCreateTeam = async (req, res) => {
  try {
    console.log("getCreateTeam called");
    const teams = await Team.find().sort({ createdAt: -1 });
    console.log("Teams loaded:", teams); // Debug log
    res.render("admin/createTeam", {
      title: "Create Team",
      teams: teams,
      currentPage: "teams",
      breadcrumbs: ["Teams", "Create"],
      layout: "admin",
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.render("admin/createTeam", {
      title: "Create Team",
      teams: [],
      currentPage: "teams",
      error: "Unable to load teams",
      breadcrumbs: ["Teams", "Create"],
      layout: "admin",
    });
  }
};

// Create new team
exports.createTeam = async (req, res) => {
  try {
    console.log("createTeam called with data:", req.body);
    const { teamName } = req.body;

    if (!teamName || teamName.trim() === "") {
      return res.redirect("/admin/teams?error=Team name is required");
    }

    // Check if team already exists
    const existingTeam = await Team.findOne({ teamName: teamName.trim() });
    if (existingTeam) {
      return res.redirect("/admin/teams?error=Team already exists");
    }

    const newTeam = new Team({
      teamName: teamName.trim(),
    });

    await newTeam.save();
    console.log("Team created successfully:", newTeam);

    // Redirect to prevent form resubmission
    res.redirect("/admin/teams?success=Team created successfully");
  } catch (error) {
    console.error("Error creating team:", error);
    if (error.code === 11000) {
      // Duplicate key error
      res.redirect("/admin/teams?error=Team name already exists");
    } else {
      res.redirect("/admin/teams?error=Error creating team");
    }
  }
};

exports.getCreatePlayer = async (req, res) => {
  try {
    console.log("getCreatePlayer called");
    const teams = await Team.find().sort({ teamName: 1 });
    const players = await Player.find()
      .populate("team", "teamName")
      .sort({ createdAt: -1 })
      .limit(5);

    res.render("admin/createPlayer", {
      title: "Create Player",
      teams: teams,
      players: players,
      currentPage: "players",
      breadcrumbs: ["Players", "Create"],
      layout: "admin",
    });
  } catch (error) {
    console.error("Error fetching data for create player:", error);
    res.render("admin/createPlayer", {
      title: "Create Player",
      teams: [],
      players: [],
      currentPage: "players",
      error: "Unable to load data",
      breadcrumbs: ["Players", "Create"],
      layout: "admin",
    });
  }
};

exports.createPlayer = async (req, res) => {
  try {
    console.log("createPlayer called with data:", req.body);
    const { playerName, image, cost, isCaptain, information, team } = req.body;

    const newPlayer = new Player({
      playerName: playerName.trim(),
      image: image.trim(),
      cost: parseFloat(cost),
      isCaptain: isCaptain === "on",
      information: information.trim(),
      team: team,
    });

    await newPlayer.save();
    console.log("Player created successfully:", newPlayer);

    res.redirect("/admin/players?success=Player created successfully");
  } catch (error) {
    console.error("Error creating player:", error);
    res.redirect("/admin/players?error=Error creating player");
  }
};
exports.editTeam = async (req, res) => {
  try {
    console.log("editTeam called with data:", req.body);
    const { teamId } = req.params;
    const { teamName } = req.body;

    if (!teamName || teamName.trim() === "") {
      return res.redirect("/admin?error=Team name is required");
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.redirect("/admin?error=Team not found");
    }

    // Check if new team name already exists (excluding current team)
    const existingTeam = await Team.findOne({ 
      teamName: teamName.trim(),
      _id: { $ne: teamId }
    });
    
    if (existingTeam) {
      return res.redirect("/admin?error=Team name already exists");
    }

    // Update team
    team.teamName = teamName.trim();
    await team.save();

    console.log("Team updated successfully:", team);
    res.redirect("/admin?success=Team updated successfully");
  } catch (error) {
    console.error("Error updating team:", error);
    res.redirect("/admin?error=Error updating team");
  }
};

// THÊM: Delete team (with validation)
exports.deleteTeam = async (req, res) => {
  try {
    console.log("deleteTeam called for team:", req.params.teamId);
    const { teamId } = req.params;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.redirect("/admin?error=Team not found");
    }

    // Check if team has players
    const playersInTeam = await Player.countDocuments({ team: teamId });
    if (playersInTeam > 0) {
      return res.redirect("/admin?error=Cannot delete team. Team still has " + playersInTeam + " player(s). Please move or delete all players first.");
    }

    // Delete team
    await Team.findByIdAndDelete(teamId);
    
    console.log("Team deleted successfully:", team.teamName);
    res.redirect("/admin?success=Team deleted successfully");
  } catch (error) {
    console.error("Error deleting team:", error);
    res.redirect("/admin?error=Error deleting team");
  }
};

// THÊM: Get player for edit
exports.getEditPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    
    const player = await Player.findById(playerId).populate("team", "teamName");
    if (!player) {
      return res.redirect("/admin?error=Player not found");
    }

    const teams = await Team.find().sort({ teamName: 1 });

    res.json({
      success: true,
      player: player,
      teams: teams
    });
  } catch (error) {
    console.error("Error fetching player for edit:", error);
    res.json({
      success: false,
      error: "Error fetching player data"
    });
  }
};

// THÊM: Edit player
exports.editPlayer = async (req, res) => {
  try {
    console.log("editPlayer called with data:", req.body);
    const { playerId } = req.params;
    const { playerName, image, cost, isCaptain, information, team } = req.body;

    // Validation
    if (!playerName || !image || !cost || !information || !team) {
      return res.redirect("/admin?error=All fields are required");
    }

    // Check if player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.redirect("/admin?error=Player not found");
    }

    // Check if team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      return res.redirect("/admin?error=Selected team does not exist");
    }

    // Update player
    player.playerName = playerName.trim();
    player.image = image.trim();
    player.cost = parseFloat(cost);
    player.isCaptain = isCaptain === "on" || isCaptain === true;
    player.information = information.trim();
    player.team = team;

    await player.save();

    console.log("Player updated successfully:", player);
    res.redirect("/admin?success=Player updated successfully");
  } catch (error) {
    console.error("Error updating player:", error);
    res.redirect("/admin?error=Error updating player");
  }
};

// THÊM: Delete player
exports.deletePlayer = async (req, res) => {
  try {
    console.log("deletePlayer called for player:", req.params.playerId);
    const { playerId } = req.params;

    // Check if player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.redirect("/admin?error=Player not found");
    }

    // Delete player (comments will be deleted automatically as they're embedded)
    await Player.findByIdAndDelete(playerId);
    
    console.log("Player deleted successfully:", player.playerName);
    res.redirect("/admin?success=Player deleted successfully");
  } catch (error) {
    console.error("Error deleting player:", error);
    res.redirect("/admin?error=Error deleting player");
  }
};

console.log("adminController exports set");
