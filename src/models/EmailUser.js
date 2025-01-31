const mongoose = require("mongoose");

const emailUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Required for email sign-up
    avatar: { type: String }, // Optional for email users
  },
  { timestamps: true }
);

module.exports = mongoose.model("emailUser", emailUserSchema);
