const jwt = require("jsonwebtoken");
const Member = require("../models/member");

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.session.user?.token ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.redirect("/login/?error=Please log in to continue");

    const decoded = jwt.verify(token, JWT_SECRET);
    const account = await Member.findById(decoded.memberID);
    if (!account) return res.status(401).json({ message: "Account not found" });
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
const authMiddlewareInView = async (req, res, next) => {
  try {
    if (!req.session.user) {
      req.session.message = "Please log in to continue.";
      return res.redirect("/login");
    }
    const token = req.session.user.token;
    if (token) {
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        // Token hết hạn, xóa session
        req.session.destroy();
        return res.redirect("/login?error=Session expired");
      }
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const account = await Member.findById(decoded.memberID);

    if (!account) {
      return res.status(401).json({ message: "Account not found" });
    }

    if (!account.isAdmin) {
      return res.redirect("/?error=Access denied. Admin privileges required");
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
const adminMiddlewareInView = async (req, res, next) => {
  try {
    // Kiểm tra xem user đã đăng nhập chưa
    if (!req.session.user) {
      return res.redirect("/login?error=Please log in to access admin panel");
    }

    // Kiểm tra xem user có phải admin không
    if (!req.session.user.isAdmin) {
      return res.redirect("/?error=Access denied. Admin privileges required");
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.redirect("/login?error=Authentication failed");
  }
};

module.exports = {
  authMiddleware,
  authMiddlewareInView,
  adminMiddleware,
  adminMiddlewareInView,
};
