const express = require("express");
const passport = require("passport");

const router = express.Router();

// MongoDB User Model:
const EmailUser = require("../models/EmailUser");

// Password handler:
const bcrypt = require("bcrypt");

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

// Signup route

router.post("/signup", (req, res) => {
  let { name, email, password, avatar } = req.body;
  name = name.trim();
  email = email.trim();
  password = password.trim();
  avatar = avatar.trim();

  if (name == "" || email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty input fields",
    });
  } else if (!/^[a-zA-Z]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Invalid name",
    });
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Invalid email",
    });
  } else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "Password must be atleast 8 characters!",
    });
  } else {
    EmailUser.find({ email })
      .then((result) => {
        if (result.length) {
          // A user already exists:
          res.json({
            status: "FAILED",
            message: "User already exists. Kindly log in",
          });
        } else {
          // Try to create a new user:

          // Password handling:
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newEmailUser = new EmailUser({
                name,
                email,
                password: hashedPassword,
                avatar,
              });

              newEmailUser
                .save()
                .then((result) => {
                  res.json({
                    status: "SUCCESS",
                    message: "Signup Successful!",
                    data: result,
                  });
                })
                .catch((err) => {
                  res.json({
                    status: "FAILED",
                    message: "An error occurred while saving user account!",
                  });
                });
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: "An error occurred while hashing password!",
              });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for existing user!",
        });
      });
  }
});

// Login route
router.post("/login", (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Email and Password are required!",
    });
  } else {
    // Check if User exists:
    EmailUser.find({ email })
      .then((data) => {
        if (data.length) {
          // User exists

          const hashedPassword = data[0].password;
          bcrypt
            .compare(password, hashedPassword)
            .then((result) => {
              if (result) {
                res.json({
                  status: "SUCCESS",
                  message: "Login Successful!",
                  data: data,
                });
              } else {
                res.json({
                  status: "FAILED",
                  message: "Incorrect credentials. Try Again!",
                });
              }
            })
            .catch((err) => {
              res.json({
                status: "FAILED",
                message: "An error occurred while comparing passwords",
              });
            });
        } else {
          res.json({
            status: "FAILED",
            message: "Invalid credentials. Try Again!",
          });
        }
      })
      .catch((err) => {
        res.json({
          status: "FAILED",
          message: "An error occurred while checking for existing user",
        });
      });
  }
});

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
