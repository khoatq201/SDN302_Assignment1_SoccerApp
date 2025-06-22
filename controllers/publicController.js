const { Player } = require("../models/player");
const { Member } = require("../models/member");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Team } = require("../models/team");

exports.getAllPlayers = async (req, res) => {
  try {
    // Lấy search và filter parameters
    const searchName = req.query.search || "";
    const filterTeam = req.query.team || "";

    // Tạo query object
    let query = {};

    // Thêm search condition nếu có
    if (searchName) {
      query.playerName = { $regex: searchName, $options: "i" }; // Case insensitive search
    }

    // Thêm team filter nếu có
    if (filterTeam) {
      query.team = filterTeam;
    }

    // Lấy players với query và populate team
    const players = await Player.find(query).populate("team", "teamName");

    // Lấy tất cả teams để hiển thị trong dropdown
    const teams = await Team.find().sort({ teamName: 1 });

    // Lấy success/error messages từ query parameters
    const success = req.query.success;
    const error = req.query.error;

    res.render("index", {
      title: "Football Players",
      players: players,
      teams: teams, // Truyền teams để hiển thị trong filter
      user: req.session.user || null,
      success: success,
      error: error,
      searchName: searchName, // Truyền lại search value
      filterTeam: filterTeam, // Truyền lại filter value
      totalPlayers: players.length, // Số lượng players tìm được
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.render("index", {
      title: "Football Players",
      players: [],
      teams: [],
      user: req.session.user || null,
      error: "Unable to load players",
      searchName: "",
      filterTeam: "",
      totalPlayers: 0,
    });
  }
};
// Thêm function này vào publicController.js
exports.getPlayerDetail = async (req, res) => {
  try {
    const playerId = req.params.id;

    const player = await Player.findById(playerId).populate("team", "teamName");

    if (!player) {
      return res.redirect("/?error=Player not found");
    }

    // Tính rating trung bình
    let averageRating = 0;
    let ratingLevel = 0; // THÊM ratingLevel

    if (player.comments && player.comments.length > 0) {
      const totalRating = player.comments.reduce(
        (sum, comment) => sum + comment.rating,
        0
      );
      averageRating = (totalRating / player.comments.length).toFixed(1);

      // Tính ratingLevel dựa trên averageRating
      const numRating = parseFloat(averageRating);
      if (numRating >= 2.5) ratingLevel = 3;
      else if (numRating >= 1.5) ratingLevel = 2;
      else ratingLevel = 1;
    }

    res.render("playerDetail", {
      title: player.playerName,
      player: player,
      commentCount: player.comments.length,
      averageRating: averageRating,
      ratingLevel: ratingLevel, // THÊM ratingLevel
      user: req.session.user || null,
      layout: "main",
    });
  } catch (error) {
    console.error("Error fetching player detail:", error);
    res.redirect("/?error=Unable to load player details");
  }
};
// API endpoint để lấy player detail (nếu muốn dùng AJAX)
// Cập nhật API endpoint
exports.getPlayerDetailAPI = async (req, res) => {
  try {
    const playerId = req.params.id;

    const player = await Player.findById(playerId).populate("team", "teamName");

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Đếm số lượng comments và tính rating trung bình
    const commentCount = player.comments ? player.comments.length : 0;
    let averageRating = 0;
    if (player.comments && player.comments.length > 0) {
      const totalRating = player.comments.reduce(
        (sum, comment) => sum + comment.rating,
        0
      );
      averageRating = (totalRating / player.comments.length).toFixed(1);
    }

    // Trả về player info không bao gồm comments chi tiết
    const playerResponse = {
      _id: player._id,
      playerName: player.playerName,
      image: player.image,
      cost: player.cost,
      isCaptain: player.isCaptain,
      information: player.information,
      team: player.team,
      commentCount: commentCount,
      averageRating: averageRating, // Thêm average rating
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };

    res.json({
      success: true,
      player: playerResponse,
    });
  } catch (error) {
    console.error("Error fetching player detail:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load player details",
    });
  }
};
// Thêm vào function getPlayerComments
// Trong function getPlayerComments, thêm logic check user đã comment chưa
exports.getPlayerComments = async (req, res) => {
  try {
    const playerId = req.params.id;
    const user = req.session.user;

    // Lấy player không populate comments trước
    const player = await Player.findById(playerId).populate("team", "teamName");

    if (!player) {
      return res.redirect("/?error=Player not found");
    }

    // Manual populate comments authors
    const populatedComments = [];
    for (const comment of player.comments) {
      try {
        const author = await Member.findById(comment.author).select(
          "name memberName"
        );
        
        // Kiểm tra xem comment này có phải của user hiện tại không
        const isUserComment = user && comment.author.toString() === user.id.toString();
        
        // Kiểm tra có thể edit không (createdAt === updatedAt và là comment của user)
        const canEdit = isUserComment && 
          comment.createdAt.getTime() === comment.updatedAt.getTime();

        populatedComments.push({
          _id: comment._id,
          rating: comment.rating,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          author: author || {
            name: "Unknown User",
            memberName: "deleted",
            _id: comment.author, // Thêm _id để so sánh
          },
          isUserComment: isUserComment, // THÊM: Đánh dấu comment của user
          canEdit: canEdit, // THÊM: Có thể edit không
        });
      } catch (err) {
        console.error("Error fetching comment author:", err);
        populatedComments.push({
          _id: comment._id,
          rating: comment.rating,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          author: {
            name: "Unknown User",
            memberName: "error",
            _id: comment.author,
          },
          isUserComment: false,
          canEdit: false,
        });
      }
    }

    // Tính rating trung bình
    let averageRating = 0;
    let ratingLevel = 0;
    if (player.comments && player.comments.length > 0) {
      const totalRating = player.comments.reduce(
        (sum, comment) => sum + comment.rating,
        0
      );
      averageRating = (totalRating / player.comments.length).toFixed(1);

      const numRating = parseFloat(averageRating);
      if (numRating >= 2.5) ratingLevel = 3;
      else if (numRating >= 1.5) ratingLevel = 2;
      else if (numRating > 0) ratingLevel = 1;
      else ratingLevel = 0;
    }

    // Sắp xếp comments theo thời gian (mới nhất trước)
    const sortedComments = populatedComments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Kiểm tra xem user đã comment chưa và lấy comment của user
    let userHasCommented = false;
    let userComment = null;
    let canEditComment = false;

    if (user && player.comments.length > 0) {
      userComment = sortedComments.find(comment => comment.isUserComment);
      
      if (userComment) {
        userHasCommented = true;
        canEditComment = userComment.canEdit;
      }
    }

    // Lấy messages từ query parameters
    const successMessage = req.query.success;
    const errorMessage = req.query.error;

    res.render("comment", {
      title: `Comments for ${player.playerName}`,
      player: player,
      comments: sortedComments,
      commentCount: player.comments.length,
      averageRating: averageRating,
      ratingLevel: ratingLevel,
      user: user || null,
      userHasCommented: userHasCommented, // FLAG kiểm tra user đã comment chưa
      userComment: userComment, // THÊM: Comment của user hiện tại
      canEditComment: canEditComment, // THÊM: User có thể edit comment không
      successMessage: successMessage, // SUCCESS MESSAGE
      errorMessage: errorMessage, // ERROR MESSAGE
      layout: "main",
    });
  } catch (error) {
    console.error("Error fetching player comments:", error);
    res.redirect("/?error=Unable to load comments");
  }
};
//ajax search players
exports.searchPlayers = async (req, res) => {
  try {
    const { search, team } = req.query;

    let query = {};
    if (search) {
      query.playerName = { $regex: search, $options: "i" };
    }
    if (team) {
      query.team = team;
    }

    const players = await Player.find(query).populate("team", "teamName");

    res.json({
      success: true,
      players: players,
      count: players.length,
    });
  } catch (error) {
    console.error("Error searching players:", error);
    res.status(500).json({
      success: false,
      message: "Error searching players",
    });
  }
};

exports.getLoginPage = async (req, res) => {
  try {
    res.render("login", {
      title: "Login Page",
      layout: false,
    });
  } catch (error) {
    console.error("Error fetching login page:", error);
    res.redirect("/?error=Unable to load login page");
  }
};

exports.signIn = async (req, res) => {
  const secretKey = process.env.JWT_SECRET;
  try {
    const { memberName, password } = req.body;
    const findUsername = await Member.findOne({ memberName });
    if (!findUsername) {
      return res.status(400).json({ msg: "Username not found" });
    }
    const isMatch = await bcrypt.compare(password, findUsername.password);
    if (!isMatch) {
      return res.redirect("/login?error=Invalid credentials");
    }
    const accessToken = jwt.sign(
      {
        memberID: findUsername._id,
        memberName: findUsername.memberName,
        role: findUsername.isAdmin ? "admin" : "user",
      },
      secretKey,
      { expiresIn: "1h" }
    );
    req.session.user = {
      id: findUsername._id,
      memberName: findUsername.memberName,
      name: findUsername.name,
      YOB: findUsername.YOB,
      isAdmin: findUsername.isAdmin,
      token: accessToken,
    };
    res.redirect("/?success=Login successful");
  } catch (err) {
    console.error("Error during login:", err);
    res.redirect("/login?error=Login failed. Please try again.");
  }
};

exports.getRegisterPage = async (req, res) => {
  try {
    res.render("register", {
      title: "Register Page",
      layout: false,
    });
  } catch (error) {
    console.error("Error fetching register page:", error);
    res.redirect("/?error=Unable to load register page");
  }
};

exports.signUp = async (req, res) => {
  try {
    const { memberName, password, name, YOB } = req.body;
    const findMember = await Member.findOne({ memberName });
    if (findMember) {
      return res.redirect("/register?error=Username already exists");
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newMember = await Member.create({
      memberName: memberName,
      password: hashPassword,
      name: name,
      YOB: YOB,
    });
    const accessToken = jwt.sign(
      {
        memberID: newMember._id,
        memberName: newMember.memberName,
        role: newMember.isAdmin ? "admin" : "user",
      },
      secretKey,
      { expiresIn: "1h" }
    );

    req.session.user = {
      id: newMember._id,
      memberName: newMember.memberName,
      name: newMember.name,
      isAdmin: newMember.isAdmin,
      YOB: newMember.YOB,
      token: accessToken,
    };
    res.redirect("/?success=Registration successful");
  } catch (error) {
    console.error("Error during registration:", error);
    res.redirect("/register?error=Registration failed. Please try again.");
  }
};
exports.logout = (req, res) => {
  try {
    // Logout từ Passport (cho Google OAuth)
    req.logout((err) => {
      if (err) {
        console.error("Passport logout error:", err);
      }
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.redirect("/?error=Logout failed");
        }
        res.clearCookie("connect.sid");
        res.redirect("/?success=Logout successful");
      });
    });
  } catch (error) {
    console.error("Error during logout:", error);
    res.redirect("/?error=Logout failed");
  }
};
