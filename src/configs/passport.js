const GoogleStrategy = require("passport-google-oauth2").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const bcrypt = require("bcrypt");
const OAuthUser = require("../models/OAuthUser");
const EmailUser = require("../models/EmailUser");

// GOOGLE OAUTH STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let oauthUser = await OAuthUser.findOne({ googleId: profile.id });

        if (!oauthUser) {
          oauthUser = new OAuthUser({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
          });
          await oauthUser.save();
        }
        return done(null, oauthUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// LOCAL STRATEGY FOR EMAIL/PASSWORD LOGIN
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" }, // Passport expects "username" by default, override to "email"
    async (email, password, done) => {
      try {
        const emailUser = await EmailUser.findOne({ email });

        if (!emailUser) {
          return done(null, false, { message: "User not found" });
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, emailUser.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, emailUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// SERIALIZE & DESERIALIZE USERS (Works for both OAuth & Email Users)
passport.serializeUser((user, done) =>
  done(null, { id: user.id, type: user.googleId ? "oauth" : "email" })
);

passport.deserializeUser(async (data, done) => {
  try {
    let user;
    if (data.type === "oauth") {
      user = await OAuthUser.findById(data.id);
    } else {
      user = await EmailUser.findById(data.id);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
