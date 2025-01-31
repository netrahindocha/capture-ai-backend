const mongoose = require("mongoose");

const oauthUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("oAuthUser", oauthUserSchema);
