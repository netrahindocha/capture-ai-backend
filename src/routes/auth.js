const express = require("express");
const passport = require("passport");

const router = express.Router();

// MongoDB User Model:
const EmailUser = require("../models/EmailUser");

// MongoDB Email Verification Model:
const EmailVerification = require("../models/EmailVerification");

// Email Handler
const nodemailer = require("nodemailer");

// Unique String (UUID version 4)
const { v4: uuidv4 } = require("uuid");

// ENV variables
require("dotenv").config();

// Password handler:
const bcrypt = require("bcrypt");
const path = require("path");

// Nodemailer Transporter
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.AUTH_EMAIL,
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    refreshToken: process.env.AUTH_REFRESH_TOKEN,
  },
});

// Testing Success
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

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
  let { fullName, email, password, avatar } = req.body;
  fullName = fullName.trim();
  email = email.trim();
  password = password.trim();
  avatar = avatar.trim();
  console.log({
    fullName: fullName,
    email: email,
    password: password,
  });

  if (fullName == "" || email == "" || password == "") {
    res.json({
      status: "FAILED",
      message: "Empty input fields",
    });
  } else if (!/^[a-zA-Z ]*$/.test(fullName)) {
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
                fullName,
                email,
                password: hashedPassword,
                avatar,
                verified: false,
              });

              newEmailUser
                .save()
                .then((result) => {
                  // Handle account verification
                  sendVerificationEmail(result, res);
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

// Send verification email
const sendVerificationEmail = ({ _id, email, fullName }, res) => {
  // url to be used in the email
  const currentUrl = "http://localhost:5000/api/";

  // Create unique string for email verification
  const verifyString = uuidv4() + _id;

  // Mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<h4>Hello ${fullName}</h4><p>Verify your email address to complete the signup into your account.</p><p>Here is the link: <a href=${
      currentUrl + "auth/verify/" + _id + "/" + verifyString
    }>here</a> to proceed.</p>`,
  };

  // Hash the verifyString
  const saltRounds = 10;
  bcrypt
    .hash(verifyString, saltRounds)
    .then((hashedVerifyString) => {
      // Set values in emailVerification collection
      const newVerification = new EmailVerification({
        userId: _id,
        userEmail: email,
        userName: fullName,
        verifyString: hashedVerifyString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000,
      });
      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              // Email sent and verification record saved
              res.json({
                status: "PENDING",
                message: "Verification email sent!",
              });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: "FAILED",
                message: "Verification email failed",
              });
            });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            status: "FAILED",
            message: "Couldn't save verification email data!",
          });
        });
    })
    .catch(() => {
      res.json({
        status: "FAILED",
        message: "An error occurred while hashing email data",
      });
    });
};

// Verify email
router.get("/verify/:userId/:verifyString", (req, res) => {
  let { userId, verifyString } = req.params;

  EmailVerification.find({ userId })
    .then((result) => {
      if (result.length > 0) {
        // User verification record exists so we proceed
        const { expiresAt } = result[0];

        const hashedVerifyString = result[0].verifyString;

        // Checking for expired verifyString
        if (expiresAt < Date.now()) {
          // Record has expired so we delete it
          EmailVerification.deleteOne({ userId })
            .then((result) => {
              EmailUser.deleteOne({ _id: userId })
                .then(() => {
                  let message = "Link has expired. Please sign up again.";
                  res.redirect(`/auth/verified/error=true&message=${message}`);
                })
                .catch((error) => {
                  let message =
                    "Clearing user with expired unique verify string failed";
                  res.redirect(`/auth/verified/error=true&message=${message}`);
                });
            })
            .catch((error) => {
              console.log(error);
              let message =
                "An error occurred while clearing expired user verification record";
              res.redirect(`/auth/verified/error=true&message=${message}`);
            });
        } else {
          // Valid record exists so we validate the verify user string

          // First compare the hashed unique verify string
          bcrypt
            .compare(verifyString, hashedVerifyString)
            .then((result) => {
              if (result) {
                // Strings match

                EmailUser.updateOne({ _id: userId }, { verified: true })
                  .then(() => {
                    console.log("userId: ", userId);
                    EmailVerification.deleteOne({ userId })
                      .then(() => {
                        res.json({
                          status: "SENDING FILE",
                        });
                      })
                      .catch((error) => {
                        console.log(error);
                        let message =
                          "An error occurred while finalizing successful verification.";
                        res.redirect(
                          `/api/auth/verified/error=true&message=${message}`
                        );
                      });
                  })
                  .catch((error) => {
                    console.log(error);
                    let message =
                      "An error occurred while updating user record to show verified.";
                    res.redirect(
                      `/auth/verified/error=true&message=${message}`
                    );
                  });
              } else {
                // Existing record but incorrect verification details passed.
                let message =
                  "Invalid verification details passed. Check your inbox.";
                res.redirect(`/auth/verified/error=true&message=${message}`);
              }
            })
            .catch((error) => {
              let message = "An error occurred while comparing unique strings.";
              res.redirect(`/auth/verified/error=true&message=${message}`);
            });
        }
      } else {
        // User verification record doesn't exist
        let message =
          "Account record doesn't exist or has been verified already. Please signup or login.";
        res.redirect(`/auth/verified/error=true&message=${message}`);
      }
    })
    .catch((error) => {
      console.log(error);
      let message =
        "An error occurred while checking for existing user verification record";
      res.redirect(`/auth/verified/error=true&message=${message}`);
    });
});

// Verified page route
router.get("/verified", (req, res) => {
  res.json({
    status: "SENDING FILE",
  });
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

          // Check if user is verified
          if (!data[0].verified) {
            res.json({
              status: "FAILED",
              message: "Email hasn't been verified yet. Check your inbox.",
            });
          } else {
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
          }
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
