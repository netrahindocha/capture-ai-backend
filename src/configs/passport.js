const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");
const OAuthUser = require("../models/OAuthUser");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback", // OAuth callback URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the oauthUser already exists in the DB
        let oauthUser = await OAuthUser.findOne({ googleId: profile.id });
        console.log("accessToken: ", accessToken);
        console.log("refreshToken: ", refreshToken);
        if (!oauthUser) {
          // If oauthUser doesn't exist, create a new oauthUser
          oauthUser = new OAuthUser({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
          });
          await oauthUser.save();
        }
        return done(null, oauthUser); // Pass the oauthUser to the next step
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize oauthUser to store in session
passport.serializeUser((oauthUser, done) => done(null, oauthUser.id));

// Deserialize oauthUser from session
passport.deserializeUser(async (id, done) => {
  try {
    const oauthUser = await OAuthUser.findById(id); // Find user by ID
    done(null, oauthUser); // Pass the user object to req.user
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
