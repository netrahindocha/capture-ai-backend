// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const authMiddleware = require("./src/middlewares/authMiddleware");

// Import routes and configs
const transcribeRoutes = require("./src/routes/transcribe");
const authRoutes = require("./src/routes/auth"); // New auth routes
require("./src/configs/passport"); // Passport configuration

const app = express();

// app.use(cors({ origin: "*" })); // Enable CORS for frontend

app.use(
  cors({
    origin: [process.env.FRONTEND_BASE_URL], // Allow both frontend URLs
    credentials: true, // Allow cookies and sessions
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allow all necessary methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow headers required for authentication
  })
);

app.use(express.json()); // Parse JSON requests

app.set("trust proxy", 1); // Trust Netlify

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api", transcribeRoutes); // Existing transcribe routes
app.use("/api/auth", authRoutes); // Authentication routes (e.g., Google OAuth)

// Summarization route
app.post("/api/summarize", async (req, res) => {
  try {
    const { transcript } = req.body;
    const summary = await generateSummary(transcript); // Your summarization function
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", authMiddleware, (req, res) => {
  // Send user data as a response
  // res.json({ message: `Welcome, ${req.user.name}`, user: req.user });
  res.redirect(`${process.env.FRONTEND_BASE_URL}/recording`);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
