var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const http = require("http");
const initSocket = require('./socket');  // Import socket initialization
dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import models
require("./models/post");
require("./models/account");
require("./models/comment");
require("./models/friendship");
require("./models/message");
require("./models/favorite");
require("./models/reel");
require("./models/notification");
require("./models/report");
require("./models/conversation");

// Import routes
var postRouter = require("./routes/post");
var accountRouter = require("./routes/account");
var commentRouter = require("./routes/comment");
var friendshipRouter = require("./routes/friendship");
var messageRouter = require("./routes/message");
var favoriteRouter = require("./routes/favorite");
var reelRouter = require("./routes/reel");
var notificationRouter = require('./routes/notification');
var followerRouter = require("./routes/followers");
var reportRouter = require("./routes/report");

var app = express();

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = initSocket(server); // Initialize socket
app.set('io', io); // Set io instance for routes

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/mangxahoi")
  .then(() => console.log(">>>>>> Connected to database successfully"))
  .catch((err) => console.log(">>>>>> Database connection failed", err));

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// Middleware setup
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public/img")));
app.use(express.static('public'));

// Route handling
app.use("/post", postRouter);
app.use("/account", accountRouter);
app.use("/comment", commentRouter);
app.use("/friendship", friendshipRouter);
app.use("/message", messageRouter);
app.use("/favorite", favoriteRouter);
app.use("/reel", reelRouter);
app.use("/notification", notificationRouter);
app.use("/followers", followerRouter);
app.use("/report", reportRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Start server with Socket.IO support
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
