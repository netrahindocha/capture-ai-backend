const express = require("express");
const passport = require("passport");

const router = express.Router();

// Initiate Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Redirect the user after successful login
    res.redirect("http://localhost:3000"); // Adjust to your frontend URL
  }
);

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie("connect.sid");
      res.send("Logged out successfully!");
    });
  });
});

// Check if user is authenticated
router.get("/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

module.exports = router;
