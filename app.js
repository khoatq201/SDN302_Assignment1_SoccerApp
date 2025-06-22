var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();
require("./models/member");
require("./models/team");
require("./models/player");
require("./models/comment");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var adminRouter = require("./routes/adminRouter");
const memberRouter = require("./routes/memberRouter");
const authRouter = require("./routes/authRouter");
const passport = require("./config/passport");
const handlebars = require("express-handlebars");
const session = require("express-session");

var app = express();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
// Session

// view engine setup
app.engine(
  "hbs",
  handlebars.engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    // Add helpers here
    helpers: {
      formatDate: function (date) {
        if (!date) return "N/A";
        const options = {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        };
        return new Date(date).toLocaleDateString("en-US", options);
      },
      formatCurrency: function (amount) {
        if (!amount) return "$0";
        return "$" + parseFloat(amount).toFixed(2) + "M";
      },
      ifEquals: function (arg1, arg2, options) {
        if (arg1 == arg2) {
          return options.fn(this); // Render nội dung bên trong
        } else {
          return options.inverse(this); // Render nội dung của {{else}}
        }
      },
      substring: function (str, start, end) {
        if (!str) return "";
        return str.substring(start, end);
      },
      eq: function (a, b) {
        return a === b;
      },
      gt: function (a, b) {
        return a > b;
      },
       eq: function (a, b, options) {
    if (options && typeof options.fn === 'function') {
      return a === b ? options.fn(this) : options.inverse(this);
    }
    return a === b;
  },
  
  // Helper để check không bằng
  unless: function (condition, options) {
    if (!condition) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
    },
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
// THÊM: Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/members", memberRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
