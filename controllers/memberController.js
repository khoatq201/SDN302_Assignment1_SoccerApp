const { Player } = require("../models/player");
const { Team } = require("../models/team");
const { Comment } = require("../models/comment");
const { Member } = require("../models/member");
const bcrypt = require("bcrypt");

// Post a comment for a player
exports.postComment = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { rating, content } = req.body;
    const userId = req.session.user.id; // Lấy user ID từ session

    console.log("Post comment request:", { playerId, rating, content, userId });

    // Validation input
    if (!rating || !content) {
      return res.redirect(
        `/players/${playerId}/comments?error=Rating and content are required`
      );
    }

    // Validate rating range
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 3) {
      return res.redirect(
        `/players/${playerId}/comments?error=Rating must be between 1 and 3`
      );
    }

    // Validate content
    if (content.trim().length === 0) {
      return res.redirect(
        `/players/${playerId}/comments?error=Comment content cannot be empty`
      );
    }

    if (content.length > 500) {
      return res.redirect(
        `/players/${playerId}/comments?error=Comment content cannot exceed 500 characters`
      );
    }

    // Kiểm tra player có tồn tại không
    const player = await Player.findById(playerId);
    if (!player) {
      return res.redirect(`/?error=Player not found`);
    }

    // Kiểm tra member có tồn tại không
    const member = await Member.findById(userId);
    if (!member) {
      return res.redirect(
        `/players/${playerId}/comments?error=Member not found`
      );
    }

    // KIỂM TRA XEM MEMBER ĐÃ COMMENT CHO PLAYER NÀY CHƯA
    const existingComment = player.comments.find(
      (comment) => comment.author.toString() === userId.toString()
    );

    if (existingComment) {
      return res.redirect(
        `/players/${playerId}/comments?error=You have already commented on this player. Each member can only comment once per player.`
      );
    }

    // Tạo comment mới
    const newComment = {
      rating: ratingNum,
      content: content.trim(),
      author: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Thêm comment vào player
    player.comments.push(newComment);
    await player.save();

    console.log("Comment added successfully");

    // Redirect với success message
    res.redirect(
      `/players/${playerId}/comments?success=Comment posted successfully!`
    );
  } catch (error) {
    console.error("Error posting comment:", error);
    res.redirect(
      `/players/${playerId}/comments?error=Internal server error. Please try again later.`
    );
  }
};
// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.redirect("/login");
    }

    // Get fresh user data from database
    const userData = await Member.findById(user.id);
    if (!userData) {
      return res.redirect("/login?error=User not found");
    }

    res.render("users/index", {
      title: `${userData.name} - Profile`,
      user: userData,
      successMessage: req.query.success,
      errorMessage: req.query.error,
      layout: false, // Use custom layout
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.redirect("/?error=Unable to load profile");
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { name, memberName, YOB } = req.body;

    // Validation
    if (!name || !memberName || !YOB) {
      return res.redirect("/members?error=All fields are required");
    }

    // Check if memberName is unique (excluding current user)
    const existingUser = await Member.findOne({
      memberName: memberName,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.redirect("/members?error=Username already exists");
    }

    // Validate YOB
    const yearOfBirth = parseInt(YOB);
    if (yearOfBirth < 1950 || yearOfBirth > 2010) {
      return res.redirect(
        "/members?error=Year of birth must be between 1950 and 2010"
      );
    }

    // Update user
    const updatedUser = await Member.findByIdAndUpdate(
      userId,
      {
        name: name.trim(),
        memberName: memberName.trim(),
        YOB: yearOfBirth,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.redirect("/members?error=User not found");
    }

    // Update session with new data
    req.session.user = {
      id: updatedUser._id,
      name: updatedUser.name,
      memberName: updatedUser.memberName,
      YOB: updatedUser.YOB,
      isAdmin: updatedUser.isAdmin,
    };

    res.redirect("/members?success=Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    res.redirect("/members?error=Error updating profile. Please try again.");
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.redirect("/members?error=All password fields are required");
    }

    if (newPassword !== confirmPassword) {
      return res.redirect(
        "/members?error=New password and confirm password do not match"
      );
    }

    if (newPassword.length < 6) {
      return res.redirect(
        "/members?error=New password must be at least 6 characters long"
      );
    }

    // Get user from database
    const user = await Member.findById(userId);
    if (!user) {
      return res.redirect("/members?error=User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.redirect("/members?error=Current password is incorrect");
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await Member.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    res.redirect("/members?success=Password changed successfully!");
  } catch (error) {
    console.error("Error changing password:", error);
    res.redirect("/members?error=Error changing password. Please try again.");
  }
};
// Edit comment for a player
exports.editComment = async (req, res) => {
  try {
    const { playerId, commentId } = req.params;
    const { rating, content } = req.body;
    const userId = req.session.user.id;

    console.log("Edit comment request:", { playerId, commentId, rating, content, userId });

    // Validation input
    if (!rating || !content) {
      return res.redirect(
        `/players/${playerId}/comments?error=Rating and content are required`
      );
    }

    // Validate rating range
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 3) {
      return res.redirect(
        `/players/${playerId}/comments?error=Rating must be between 1 and 3`
      );
    }

    // Validate content
    if (content.trim().length === 0) {
      return res.redirect(
        `/players/${playerId}/comments?error=Comment content cannot be empty`
      );
    }

    if (content.length > 500) {
      return res.redirect(
        `/players/${playerId}/comments?error=Comment content cannot exceed 500 characters`
      );
    }

    // Kiểm tra player có tồn tại không
    const player = await Player.findById(playerId);
    if (!player) {
      return res.redirect(`/?error=Player not found`);
    }

    // Tìm comment của user
    const comment = player.comments.id(commentId);
    if (!comment) {
      return res.redirect(
        `/players/${playerId}/comments?error=Comment not found`
      );
    }

    // Kiểm tra xem comment có phải của user hiện tại không
    if (comment.author.toString() !== userId.toString()) {
      return res.redirect(
        `/players/${playerId}/comments?error=You can only edit your own comments`
      );
    }

    // Kiểm tra xem đã edit chưa (createdAt và updatedAt khác nhau = đã edit)
    if (comment.createdAt.getTime() !== comment.updatedAt.getTime()) {
      return res.redirect(
        `/players/${playerId}/comments?error=You can only edit your comment once. This comment has already been edited.`
      );
    }

    // Cập nhật comment
    comment.rating = ratingNum;
    comment.content = content.trim();
    comment.updatedAt = new Date();

    await player.save();

    console.log("Comment edited successfully");

    // Redirect với success message
    res.redirect(
      `/players/${playerId}/comments?success=Comment updated successfully!`
    );
  } catch (error) {
    console.error("Error editing comment:", error);
    res.redirect(
      `/players/${playerId}/comments?error=Internal server error. Please try again later.`
    );
  }
};