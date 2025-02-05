const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    verifyString: { type: String, required: true, unique: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("emailVerification", emailVerificationSchema);
